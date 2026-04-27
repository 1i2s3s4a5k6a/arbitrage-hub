-- ArbitrageHub — Initial PostgreSQL Schema Migration
-- Run this once against your Supabase database before deploying.
-- You can run it in Supabase → SQL Editor → paste and click Run.

-- ── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Enums ───────────────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE subscription_tier   AS ENUM ('free', 'pro', 'premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE subscription_status AS ENUM ('active', 'cancelled', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE role                AS ENUM ('user', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE bet_outcome         AS ENUM ('pending', 'won', 'lost', 'voided');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE arbitrage_type      AS ENUM ('2-way', '3-way');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE risk_level          AS ENUM ('low', 'medium', 'high');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE alert_type          AS ENUM ('arbitrage', 'odds_change', 'match_update');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id                   SERIAL PRIMARY KEY,
  open_id              VARCHAR(64)          NOT NULL UNIQUE,
  name                 TEXT,
  email                VARCHAR(320),
  login_method         VARCHAR(64),
  subscription_tier    subscription_tier    NOT NULL DEFAULT 'free',
  subscription_status  subscription_status  NOT NULL DEFAULT 'active',
  stripe_customer_id   VARCHAR(255),
  role                 role                 NOT NULL DEFAULT 'user',
  created_at           TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  last_signed_in       TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subscriptions (
  id                      SERIAL PRIMARY KEY,
  user_id                 INTEGER              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tier                    subscription_tier    NOT NULL,
  status                  subscription_status  NOT NULL DEFAULT 'active',
  stripe_subscription_id  VARCHAR(255),
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancelled_at            TIMESTAMPTZ,
  created_at              TIMESTAMPTZ          NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ          NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bets (
  id              SERIAL PRIMARY KEY,
  user_id         INTEGER       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  match_id        VARCHAR(255),
  bookmaker       VARCHAR(100),
  market          VARCHAR(100),
  odds            NUMERIC(10,3),
  stake           NUMERIC(10,2),
  outcome         bet_outcome   NOT NULL DEFAULT 'pending',
  profit          NUMERIC(10,2),
  roi_percentage  NUMERIC(10,2),
  placed_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  settled_at      TIMESTAMPTZ,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS odds (
  id           SERIAL PRIMARY KEY,
  match_id     VARCHAR(255)  NOT NULL,
  bookmaker    VARCHAR(100)  NOT NULL,
  market       VARCHAR(100)  NOT NULL,
  option       VARCHAR(100)  NOT NULL,
  odds_value   NUMERIC(10,3) NOT NULL,
  last_updated TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at   TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS odds_history (
  id          SERIAL PRIMARY KEY,
  match_id    VARCHAR(255)  NOT NULL,
  bookmaker   VARCHAR(100)  NOT NULL,
  market      VARCHAR(100)  NOT NULL,
  option      VARCHAR(100)  NOT NULL,
  odds_value  NUMERIC(10,3) NOT NULL,
  recorded_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS arbitrage_opportunities (
  id                 SERIAL PRIMARY KEY,
  match_id           VARCHAR(255)   NOT NULL,
  type               arbitrage_type NOT NULL,
  profit_percentage  NUMERIC(10,4)  NOT NULL,
  roi                NUMERIC(10,4)  NOT NULL,
  risk_level         risk_level     NOT NULL,
  stake_distribution JSONB          NOT NULL,
  bookmakers         JSONB          NOT NULL,
  is_active          BOOLEAN        NOT NULL DEFAULT TRUE,
  detected_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  expired_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alerts (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER    NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type       alert_type NOT NULL,
  title      VARCHAR(255) NOT NULL,
  content    TEXT,
  is_read    BOOLEAN    NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_preferences (
  id                    SERIAL PRIMARY KEY,
  user_id               INTEGER     NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  arbitrage_alerts      BOOLEAN     NOT NULL DEFAULT TRUE,
  odds_change_alerts    BOOLEAN     NOT NULL DEFAULT TRUE,
  match_update_alerts   BOOLEAN     NOT NULL DEFAULT TRUE,
  email_notifications   BOOLEAN     NOT NULL DEFAULT FALSE,
  push_notifications    BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ── Performance & Query Indexes ────────────────────────────────────────────
-- These address MED-5 from the audit report.

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status
  ON subscriptions(user_id, status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_id
  ON subscriptions(stripe_subscription_id);

CREATE INDEX IF NOT EXISTS idx_bets_user_placed
  ON bets(user_id, placed_at DESC);

CREATE INDEX IF NOT EXISTS idx_odds_match_updated
  ON odds(match_id, last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_odds_history_match_recorded
  ON odds_history(match_id, recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_arbitrage_active_profit
  ON arbitrage_opportunities(is_active, profit_percentage DESC);

CREATE INDEX IF NOT EXISTS idx_arbitrage_active_risk
  ON arbitrage_opportunities(is_active, risk_level);

CREATE INDEX IF NOT EXISTS idx_alerts_user_read
  ON alerts(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_alerts_user_created
  ON alerts(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_users_stripe_customer
  ON users(stripe_customer_id);
