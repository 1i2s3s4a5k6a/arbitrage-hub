import {
  pgTable,
  pgEnum,
  serial,
  integer,
  varchar,
  text,
  boolean,
  timestamp,
  numeric,
  jsonb,
} from "drizzle-orm/pg-core";

// ── Enums ──────────────────────────────────────────────────────────────────
export const subscriptionTierEnum = pgEnum("subscription_tier", [
  "free",
  "pro",
  "premium",
]);
export const subscriptionStatusEnum = pgEnum("subscription_status", [
  "active",
  "cancelled",
  "expired",
]);
export const roleEnum = pgEnum("role", ["user", "admin"]);
export const betOutcomeEnum = pgEnum("bet_outcome", [
  "pending",
  "won",
  "lost",
  "voided",
]);
export const arbitrageTypeEnum = pgEnum("arbitrage_type", ["2-way", "3-way"]);
export const riskLevelEnum = pgEnum("risk_level", ["low", "medium", "high"]);
export const alertTypeEnum = pgEnum("alert_type", [
  "arbitrage",
  "odds_change",
  "match_update",
]);

// ── Users ──────────────────────────────────────────────────────────────────
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  openId: varchar("open_id", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("login_method", { length: 64 }),
  subscriptionTier: subscriptionTierEnum("subscription_tier")
    .default("free")
    .notNull(),
  subscriptionStatus: subscriptionStatusEnum("subscription_status")
    .default("active")
    .notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  lastSignedIn: timestamp("last_signed_in").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ── Subscriptions ──────────────────────────────────────────────────────────
export const subscriptions = pgTable("subscriptions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  tier: subscriptionTierEnum("tier").notNull(),
  status: subscriptionStatusEnum("status").default("active").notNull(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  currentPeriodStart: timestamp("current_period_start"),
  currentPeriodEnd: timestamp("current_period_end"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ── Bets ───────────────────────────────────────────────────────────────────
export const bets = pgTable("bets", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  matchId: varchar("match_id", { length: 255 }),
  bookmaker: varchar("bookmaker", { length: 100 }),
  market: varchar("market", { length: 100 }),
  odds: numeric("odds", { precision: 10, scale: 3 }),
  stake: numeric("stake", { precision: 10, scale: 2 }),
  outcome: betOutcomeEnum("outcome").default("pending").notNull(),
  profit: numeric("profit", { precision: 10, scale: 2 }),
  roiPercentage: numeric("roi_percentage", { precision: 10, scale: 2 }),
  placedAt: timestamp("placed_at").defaultNow().notNull(),
  settledAt: timestamp("settled_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type Bet = typeof bets.$inferSelect;
export type InsertBet = typeof bets.$inferInsert;

// ── Current Odds ───────────────────────────────────────────────────────────
export const odds = pgTable("odds", {
  id: serial("id").primaryKey(),
  matchId: varchar("match_id", { length: 255 }).notNull(),
  bookmaker: varchar("bookmaker", { length: 100 }).notNull(),
  market: varchar("market", { length: 100 }).notNull(),
  option: varchar("option", { length: 100 }).notNull(),
  oddsValue: numeric("odds_value", { precision: 10, scale: 3 }).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Odds = typeof odds.$inferSelect;
export type InsertOdds = typeof odds.$inferInsert;

// ── Odds History ───────────────────────────────────────────────────────────
export const oddsHistory = pgTable("odds_history", {
  id: serial("id").primaryKey(),
  matchId: varchar("match_id", { length: 255 }).notNull(),
  bookmaker: varchar("bookmaker", { length: 100 }).notNull(),
  market: varchar("market", { length: 100 }).notNull(),
  option: varchar("option", { length: 100 }).notNull(),
  oddsValue: numeric("odds_value", { precision: 10, scale: 3 }).notNull(),
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export type OddsHistory = typeof oddsHistory.$inferSelect;
export type InsertOddsHistory = typeof oddsHistory.$inferInsert;

// ── Arbitrage Opportunities ────────────────────────────────────────────────
export const arbitrageOpportunities = pgTable("arbitrage_opportunities", {
  id: serial("id").primaryKey(),
  matchId: varchar("match_id", { length: 255 }).notNull(),
  type: arbitrageTypeEnum("type").notNull(),
  profitPercentage: numeric("profit_percentage", {
    precision: 10,
    scale: 4,
  }).notNull(),
  roi: numeric("roi", { precision: 10, scale: 4 }).notNull(),
  riskLevel: riskLevelEnum("risk_level").notNull(),
  stakeDistribution: jsonb("stake_distribution").notNull(),
  bookmakers: jsonb("bookmakers").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  expiredAt: timestamp("expired_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type ArbitrageOpportunity =
  typeof arbitrageOpportunities.$inferSelect;
export type InsertArbitrageOpportunity =
  typeof arbitrageOpportunities.$inferInsert;

// ── Alerts ─────────────────────────────────────────────────────────────────
export const alerts = pgTable("alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: alertTypeEnum("type").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  isRead: boolean("is_read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Alert = typeof alerts.$inferSelect;
export type InsertAlert = typeof alerts.$inferInsert;

// ── Alert Preferences ──────────────────────────────────────────────────────
export const alertPreferences = pgTable("alert_preferences", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().unique(),
  arbitrageAlerts: boolean("arbitrage_alerts").default(true).notNull(),
  oddsChangeAlerts: boolean("odds_change_alerts").default(true).notNull(),
  matchUpdateAlerts: boolean("match_update_alerts").default(true).notNull(),
  emailNotifications: boolean("email_notifications").default(false).notNull(),
  pushNotifications: boolean("push_notifications").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export type AlertPreference = typeof alertPreferences.$inferSelect;
export type InsertAlertPreference = typeof alertPreferences.$inferInsert;
