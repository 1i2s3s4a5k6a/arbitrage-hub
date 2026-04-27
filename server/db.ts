import { eq, and, desc, gte, count, sum } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import {
  InsertUser,
  users,
  subscriptions,
  bets,
  odds,
  oddsHistory,
  arbitrageOpportunities,
  alerts,
  alertPreferences,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

type DrizzleDb = ReturnType<typeof drizzle>;
let _db: DrizzleDb | null = null;

/**
 * Lazily initialise the Drizzle/Postgres-JS client.
 * Supabase requires SSL — the postgres-js driver enables it automatically
 * when the host contains "supabase.co".
 */
export async function getDb(): Promise<DrizzleDb | null> {
  if (_db) return _db;

  const url = process.env.DATABASE_URL;
  if (!url) return null;

  try {
    // ssl:'require' is the correct setting for Supabase pooled/direct connections
    const client = postgres(url, {
      ssl: "require",
      max: 10, // connection pool size
      idle_timeout: 20,
      connect_timeout: 10,
    });
    _db = drizzle(client);
    return _db;
  } catch (error) {
    console.warn("[Database] Failed to connect:", error);
    return null;
  }
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  const now = new Date();
  const values: InsertUser = {
    openId: user.openId,
    name: user.name ?? null,
    email: user.email ?? null,
    loginMethod: user.loginMethod ?? null,
    lastSignedIn: user.lastSignedIn ?? now,
    updatedAt: now,
    // Grant admin role to the owner account
    role: user.openId === ENV.ownerOpenId ? "admin" : (user.role ?? "user"),
  };

  const updateSet: Partial<InsertUser> = {
    name: values.name,
    email: values.email,
    loginMethod: values.loginMethod,
    lastSignedIn: values.lastSignedIn,
    updatedAt: now,
  };

  if (values.role) updateSet.role = values.role;

  try {
    // PostgreSQL upsert on the unique openId column
    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({ target: users.openId, set: updateSet });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(
  openId: string
): Promise<typeof users.$inferSelect | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result[0];
}

// ── Subscriptions ──────────────────────────────────────────────────────────

export async function getUserSubscription(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(subscriptions)
    .where(
      and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.status, "active")
      )
    )
    .orderBy(desc(subscriptions.createdAt))
    .limit(1);

  return result[0] ?? null;
}

// ── Bets ───────────────────────────────────────────────────────────────────

export async function getUserBets(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(bets)
    .where(eq(bets.userId, userId))
    .orderBy(desc(bets.placedAt))
    .limit(limit);
}

// ── Odds ───────────────────────────────────────────────────────────────────

export async function getMatchOdds(matchId: string) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(odds)
    .where(eq(odds.matchId, matchId))
    .orderBy(desc(odds.lastUpdated));
}

export async function getOddsHistory(
  matchId: string,
  bookmaker: string,
  market: string,
  option: string,
  hours = 24
) {
  const db = await getDb();
  if (!db) return [];

  const cutoff = new Date(Date.now() - hours * 3_600_000);

  return db
    .select()
    .from(oddsHistory)
    .where(
      and(
        eq(oddsHistory.matchId, matchId),
        eq(oddsHistory.bookmaker, bookmaker),
        eq(oddsHistory.market, market),
        eq(oddsHistory.option, option),
        gte(oddsHistory.recordedAt, cutoff)
      )
    )
    .orderBy(desc(oddsHistory.recordedAt));
}

// ── Arbitrage ──────────────────────────────────────────────────────────────

export async function getActiveArbitrageOpportunities(limit = 100) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(arbitrageOpportunities)
    .where(eq(arbitrageOpportunities.isActive, true))
    .orderBy(desc(arbitrageOpportunities.profitPercentage))
    .limit(limit);
}

export async function getArbitrageByRiskLevel(
  riskLevel: "low" | "medium" | "high"
) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(arbitrageOpportunities)
    .where(
      and(
        eq(arbitrageOpportunities.isActive, true),
        eq(arbitrageOpportunities.riskLevel, riskLevel)
      )
    )
    .orderBy(desc(arbitrageOpportunities.profitPercentage));
}

// ── Alerts ─────────────────────────────────────────────────────────────────

export async function getUserAlerts(userId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(alerts)
    .where(eq(alerts.userId, userId))
    .orderBy(desc(alerts.createdAt))
    .limit(limit);
}

export async function getUnreadAlertsCount(userId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: count() })
    .from(alerts)
    .where(and(eq(alerts.userId, userId), eq(alerts.isRead, false)));

  return Number(result[0]?.count ?? 0);
}

export async function getAlertPreferences(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(alertPreferences)
    .where(eq(alertPreferences.userId, userId))
    .limit(1);

  return result[0] ?? null;
}

// ── User Statistics ────────────────────────────────────────────────────────

/**
 * Uses SQL aggregates — avoids loading every bet row into memory.
 */
export async function getUserStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const [totals] = await db
    .select({
      totalBets: count(),
      totalProfit: sum(bets.profit),
    })
    .from(bets)
    .where(eq(bets.userId, userId));

  const [wins] = await db
    .select({ wonBets: count() })
    .from(bets)
    .where(and(eq(bets.userId, userId), eq(bets.outcome, "won")));

  const [losses] = await db
    .select({ lostBets: count() })
    .from(bets)
    .where(and(eq(bets.userId, userId), eq(bets.outcome, "lost")));

  const totalBets = Number(totals?.totalBets ?? 0);
  const wonBets = Number(wins?.wonBets ?? 0);
  const lostBets = Number(losses?.lostBets ?? 0);
  const totalProfit = Number(totals?.totalProfit ?? 0);

  return {
    totalBets,
    wonBets,
    lostBets,
    winRatio: totalBets > 0 ? (wonBets / totalBets) * 100 : 0,
    totalProfit,
    averageProfit: totalBets > 0 ? totalProfit / totalBets : 0,
  };
}

// ── Stripe helpers (called from webhook handler) ───────────────────────────

export async function activateSubscription(
  userId: number,
  stripeSubscriptionId: string,
  tier: "pro" | "premium",
  currentPeriodEnd: Date
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();

  // Deactivate any previous active subscription for this user
  await db
    .update(subscriptions)
    .set({ status: "cancelled", updatedAt: now })
    .where(
      and(eq(subscriptions.userId, userId), eq(subscriptions.status, "active"))
    );

  // Insert new active subscription
  await db.insert(subscriptions).values({
    userId,
    tier,
    status: "active",
    stripeSubscriptionId,
    currentPeriodStart: now,
    currentPeriodEnd,
    createdAt: now,
    updatedAt: now,
  });

  // Mirror tier on the users row
  await db
    .update(users)
    .set({ subscriptionTier: tier, subscriptionStatus: "active", updatedAt: now })
    .where(eq(users.id, userId));
}

export async function cancelSubscriptionInDb(
  stripeSubscriptionId: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const now = new Date();
  await db
    .update(subscriptions)
    .set({ status: "cancelled", cancelledAt: now, updatedAt: now })
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
}

export async function getUserByStripeCustomerId(customerId: string) {
  const db = await getDb();
  if (!db) return null;

  const result = await db
    .select()
    .from(users)
    .where(eq(users.stripeCustomerId, customerId))
    .limit(1);

  return result[0] ?? null;
}

export async function setStripeCustomerId(
  userId: number,
  customerId: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(users)
    .set({ stripeCustomerId: customerId, updatedAt: new Date() })
    .where(eq(users.id, userId));
}
