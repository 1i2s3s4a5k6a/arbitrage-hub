# ArbitrageHub — Remaining Tasks

## Before Launch Checklist

### Environment (Render Dashboard)
- [ ] `DATABASE_URL` — Supabase PostgreSQL URI set
- [ ] `JWT_SECRET` — generated with `openssl rand -hex 32`
- [ ] `ODDS_API_KEY` — set (rotate if previously exposed)
- [ ] `STRIPE_SECRET_KEY` — set from Stripe Dashboard
- [ ] `STRIPE_PUBLIC_KEY` — set from Stripe Dashboard
- [ ] `STRIPE_WEBHOOK_SECRET` — set after creating webhook endpoint
- [ ] `STRIPE_PRICE_ID_PRO` — set after creating Pro product in Stripe
- [ ] `STRIPE_PRICE_ID_PREMIUM` — set after creating Premium product in Stripe
- [ ] `FRONTEND_URL` — set to https://arbitrage-hub.onrender.com

### Database
- [ ] Run `drizzle/0001_initial_postgres.sql` in Supabase SQL Editor

### Stripe
- [ ] Create Pro product ($9.99/mo) and copy Price ID to env
- [ ] Create Premium product ($29.99/mo) and copy Price ID to env
- [ ] Register webhook endpoint in Stripe Dashboard
- [ ] Test checkout flow end-to-end with test cards

### Post-launch
- [ ] Switch from `sk_test_` to `sk_live_` Stripe keys
- [ ] Monitor Render logs for any startup warnings
- [ ] Set up Supabase database backups
