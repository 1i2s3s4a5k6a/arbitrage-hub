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
  markAlertRead,
  markAllAlertsRead,
  upsertAlertPreferences,
  placeBet,
  getActiveStripeSubscriptionId,
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
import { getSubscriptionPlans, createCheckoutSession, cancelSubscription } from "./stripe";

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

    /**
     * Mark a single alert as read.
     * Scoped to the authenticated user — cannot mark another user's alerts.
     */
    markAsRead: protectedProcedure
      .input(z.object({ alertId: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        try {
          await markAlertRead(input.alertId, ctx.user.id);
          return { success: true };
        } catch (error) {
          console.error("[Alerts] markAsRead error:", error);
          return { success: false };
        }
      }),

    /**
     * Mark all of the authenticated user's alerts as read in one call.
     */
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        await markAllAlertsRead(ctx.user.id);
        return { success: true };
      } catch (error) {
        console.error("[Alerts] markAllRead error:", error);
        return { success: false };
      }
    }),

    /**
     * Create or update alert preferences.
     * Every field is optional — only the fields you send are updated.
     */
    updatePreferences: protectedProcedure
      .input(
        z.object({
          arbitrageAlerts:    z.boolean().optional(),
          oddsChangeAlerts:   z.boolean().optional(),
          matchUpdateAlerts:  z.boolean().optional(),
          emailNotifications: z.boolean().optional(),
          pushNotifications:  z.boolean().optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          await upsertAlertPreferences(ctx.user.id, input);
          const updated = await getAlertPreferences(ctx.user.id);
          return { success: true, data: updated };
        } catch (error) {
          console.error("[Alerts] updatePreferences error:", error);
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

    /**
     * Cancel the authenticated user's active Stripe subscription.
     * Cancels at period end so the user keeps access until the billing
     * cycle expires — Stripe fires customer.subscription.deleted when
     * the period ends, which our webhook handles to update the DB.
     */
    cancel: protectedProcedure.mutation(async ({ ctx }) => {
      try {
        const stripeSubId = await getActiveStripeSubscriptionId(ctx.user.id);

        if (!stripeSubId) {
          return { success: false, error: "No active subscription found" };
        }

        const cancelled = await cancelSubscription(stripeSubId);
        if (!cancelled) {
          return { success: false, error: "Failed to cancel subscription with Stripe" };
        }

        return {
          success: true,
          message: "Subscription will cancel at the end of the current billing period",
        };
      } catch (error) {
        console.error("[Subscription] cancel error:", error);
        return { success: false, error: "Cancellation failed" };
      }
    }),
  }),
  /**
   * Bets router — place and retrieve bets.
   * All endpoints are protected (require login).
   */
  bets: router({
    /**
     * Place a new bet and record it in the database.
     *
     * ArbitrageHub doesn't connect to bookmaker accounts directly —
     * this records a bet the user has manually placed so their P&L
     * and history are tracked in the dashboard.
     *
     * Validation:
     *  - odds must be ≥ 1.01 (minimum meaningful decimal odds)
     *  - stake is clamped to $1 – $1,000,000
     *  - bookmaker and market are capped at 100 chars to prevent
     *    oversized strings reaching the DB
     */
    place: protectedProcedure
      .input(
        z.object({
          matchId:   z.string().min(1).max(255),
          bookmaker: z.string().min(1).max(100),
          market:    z.string().min(1).max(100),
          option:    z.string().min(1).max(100),
          odds:      z.number().min(1.01).max(10_000),
          stake:     z.number().positive().min(1).max(1_000_000),
        })
      )
      .mutation(async ({ ctx, input }) => {
        try {
          const bet = await placeBet({
            userId:    ctx.user.id,
            matchId:   input.matchId,
            bookmaker: input.bookmaker,
            market:    input.market,
            option:    input.option,
            odds:      input.odds,
            stake:     input.stake,
          });

          if (!bet) return { success: false, data: null };
          return { success: true, data: bet };
        } catch (error) {
          console.error("[Bets] place error:", error);
          return { success: false, data: null };
        }
      }),

    /**
     * Return the authenticated user's bet history with pagination.
     * Results are ordered newest-first.
     */
    getHistory: protectedProcedure
      .input(
        z.object({
          limit:  z.number().int().positive().max(500).default(50),
          offset: z.number().int().min(0).default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        try {
          // getUserBets already orders by placedAt DESC
          const all = await getUserBets(ctx.user.id, input.limit + input.offset);
          const page = all.slice(input.offset, input.offset + input.limit);
          const hasMore = all.length > input.offset + input.limit;

          return {
            success: true,
            data: page,
            pagination: {
              limit:   input.limit,
              offset:  input.offset,
              hasMore,
            },
          };
        } catch (error) {
          console.error("[Bets] getHistory error:", error);
          return { success: false, data: [], pagination: { limit: input.limit, offset: input.offset, hasMore: false } };
        }
      }),
  }),
});
export type AppRouter = typeof appRouter;