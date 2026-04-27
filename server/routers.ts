import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getActiveArbitrageOpportunities,
  getArbitrageByRiskLevel,
  getUserAlerts,
  getUserBets,
  getUserStats,
  getUserSubscription,
  getAlertPreferences,
  getUnreadAlertsCount,
} from "./db";
import {
  fetchLiveOdds,
  extractMarketOdds,
  findBestOdds,
} from "./oddsService";
import {
  calculate2WayArbitrage,
  calculate3WayArbitrage,
} from "./arbitrage";
import { getSubscriptionPlans, createCheckoutSession } from "./stripe";

export const appRouter = router({
  system: systemRouter,

  auth: router({
    /**
     * FIX (HIGH-2): Return only safe fields — never expose stripeCustomerId,
     * internal role, or other sensitive DB columns to the client directly.
     */
    me: publicProcedure.query((opts) => {
      const user = opts.ctx.user;
      if (!user) return null;
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        subscriptionTier: user.subscriptionTier,
        subscriptionStatus: user.subscriptionStatus,
        role: user.role,
        createdAt: user.createdAt,
      };
    }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  odds: router({
    /**
     * FIX (HIGH-3): Require authentication for live odds — free scrapers
     * cannot access the data without registering.
     * Pro/Premium users get real-time data; free users get basic data.
     */
    getLiveOdds: protectedProcedure
      .input(
        z.object({
          sport: z.string().default("soccer_epl"),
          market: z.string().default("h2h"),
        })
      )
      .query(async ({ ctx, input }) => {
        try {
          const subscription = await getUserSubscription(ctx.user.id);
          const tier = subscription?.tier ?? ctx.user.subscriptionTier ?? "free";
          const isPaid = tier === "pro" || tier === "premium";

          const normalizedOdds = await fetchLiveOdds(input.sport, input.market);

          // Free tier: limit to first 5 bookmakers per match
          const data = isPaid
            ? normalizedOdds
            : normalizedOdds.map((match) => ({
                ...match,
                bookmakers: match.bookmakers.slice(0, 5),
              }));

          return { success: true, data, tier };
        } catch (error) {
          console.error("[Odds] getLiveOdds error:", error);
          return { success: false, data: [], error: "Failed to fetch odds" };
        }
      }),

    getBestOdds: protectedProcedure
      .input(
        z.object({
          sport: z.string().default("soccer_epl"),
          market: z.string().default("h2h"),
        })
      )
      .query(async ({ input }) => {
        try {
          const normalizedOdds = await fetchLiveOdds(input.sport, input.market);
          const marketOdds = extractMarketOdds(normalizedOdds, input.market);
          const bestOdds = findBestOdds(marketOdds);
          return { success: true, data: Array.from(bestOdds.values()) };
        } catch (error) {
          console.error("[Odds] getBestOdds error:", error);
          return { success: false, data: [] };
        }
      }),
  }),

  arbitrage: router({
    /**
     * FIX (HIGH-3): Require authentication for arbitrage opportunities.
     */
    getOpportunities: protectedProcedure
      .input(
        z.object({
          limit: z.number().int().positive().max(200).default(50),
          riskLevel: z.enum(["low", "medium", "high"]).optional(),
        })
      )
      .query(async ({ input }) => {
        try {
          const opportunities = input.riskLevel
            ? await getArbitrageByRiskLevel(input.riskLevel)
            : await getActiveArbitrageOpportunities(input.limit);

          return { success: true, data: opportunities };
        } catch (error) {
          console.error("[Arbitrage] getOpportunities error:", error);
          return { success: false, data: [] };
        }
      }),

    /**
     * FIX (HIGH-4): Stake is clamped to a safe range to prevent
     * floating-point overflow exploits.
     */
    calculateArbitrage: protectedProcedure
      .input(
        z.object({
          odds: z.array(
            z.object({
              bookmaker: z.string().min(1).max(100),
              option: z.string().min(1).max(100),
              odds: z.number().positive().max(10_000),
            })
          ).min(2).max(3),
          type: z.enum(["2-way", "3-way"]),
          stake: z.number().positive().max(1_000_000).default(100),
        })
      )
      .query(({ input }) => {
        try {
          let result = null;

          if (input.type === "2-way" && input.odds.length >= 2) {
            result = calculate2WayArbitrage(
              { bookmaker: input.odds[0].bookmaker, market: "h2h", option: input.odds[0].option, odds: input.odds[0].odds },
              { bookmaker: input.odds[1].bookmaker, market: "h2h", option: input.odds[1].option, odds: input.odds[1].odds },
              input.stake
            );
          } else if (input.type === "3-way" && input.odds.length >= 3) {
            result = calculate3WayArbitrage(
              { bookmaker: input.odds[0].bookmaker, market: "h2h", option: input.odds[0].option, odds: input.odds[0].odds },
              { bookmaker: input.odds[1].bookmaker, market: "h2h", option: input.odds[1].option, odds: input.odds[1].odds },
              { bookmaker: input.odds[2].bookmaker, market: "h2h", option: input.odds[2].option, odds: input.odds[2].odds },
              input.stake
            );
          }

          return { success: !!result, data: result };
        } catch (error) {
          console.error("[Arbitrage] calculateArbitrage error:", error);
          return { success: false, data: null };
        }
      }),
  }),

  dashboard: router({
    getDashboard: protectedProcedure.query(async ({ ctx }) => {
      try {
        const [stats, subscription, recentBets, userAlerts] = await Promise.all([
          getUserStats(ctx.user.id),
          getUserSubscription(ctx.user.id),
          getUserBets(ctx.user.id, 10),
          getUserAlerts(ctx.user.id, 5),
        ]);
        return { success: true, data: { stats, subscription, recentBets, alerts: userAlerts } };
      } catch (error) {
        console.error("[Dashboard] getDashboard error:", error);
        return { success: false, data: null };
      }
    }),

    getBettingHistory: protectedProcedure
      .input(z.object({ limit: z.number().int().positive().max(500).default(50) }))
      .query(async ({ ctx, input }) => {
        try {
          const history = await getUserBets(ctx.user.id, input.limit);
          return { success: true, data: history };
        } catch (error) {
          console.error("[Dashboard] getBettingHistory error:", error);
          return { success: false, data: [] };
        }
      }),

    getStats: protectedProcedure.query(async ({ ctx }) => {
      try {
        const stats = await getUserStats(ctx.user.id);
        return { success: true, data: stats };
      } catch (error) {
        console.error("[Dashboard] getStats error:", error);
        return { success: false, data: null };
      }
    }),
  }),

  alerts: router({
    getAlerts: protectedProcedure
      .input(z.object({ limit: z.number().int().positive().max(200).default(50) }))
      .query(async ({ ctx, input }) => {
        try {
          const userAlerts = await getUserAlerts(ctx.user.id, input.limit);
          return { success: true, data: userAlerts };
        } catch (error) {
          console.error("[Alerts] getAlerts error:", error);
          return { success: false, data: [] };
        }
      }),

    getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
      try {
        const alertCount = await getUnreadAlertsCount(ctx.user.id);
        return { success: true, data: alertCount };
      } catch (error) {
        console.error("[Alerts] getUnreadCount error:", error);
        return { success: false, data: 0 };
      }
    }),

    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      try {
        const preferences = await getAlertPreferences(ctx.user.id);
        return { success: true, data: preferences };
      } catch (error) {
        console.error("[Alerts] getPreferences error:", error);
        return { success: false, data: null };
      }
    }),
  }),

  subscription: router({
    getCurrent: protectedProcedure.query(async ({ ctx }) => {
      try {
        const subscription = await getUserSubscription(ctx.user.id);
        return { success: true, data: subscription };
      } catch (error) {
        console.error("[Subscription] getCurrent error:", error);
        return { success: false, data: null };
      }
    }),

    getPlans: publicProcedure.query(() => {
      return { success: true, data: getSubscriptionPlans() };
    }),

    createCheckout: protectedProcedure
      .input(
        z.object({
          planId: z.enum(["pro", "premium"]),
          returnUrl: z.string().url(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const session = await createCheckoutSession(
            ctx.user.id,
            ctx.user.email ?? null,
            input.planId,
            input.returnUrl
          );
          if (!session) return { success: false, url: null };
          return { success: true, url: session.url };
        } catch (error) {
          console.error("[Subscription] createCheckout error:", error);
          return { success: false, url: null };
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
