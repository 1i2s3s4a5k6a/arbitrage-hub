# ArbitrageHub — Deployment Guide (Render + Supabase)

## Stack
- **Frontend/Backend:** Node.js (Express + tRPC) — deployed on Render
- **Database:** PostgreSQL via Supabase
- **Payments:** Stripe
- **Odds Data:** The Odds API v4

---

## Step 1 — Database Setup (Supabase)

1. Go to your [Supabase project](https://supabase.com/dashboard)
2. Click **SQL Editor** → **New query**
3. Paste the contents of `drizzle/0001_initial_postgres.sql` and click **Run**
4. All tables and indexes will be created

Get your connection string:
- Supabase Dashboard → Project → **Settings → Database → Connection string (URI)**
- Copy the `postgresql://postgres:...` URI
- **Do not commit this value** — add it only to Render's environment variables

---

## Step 2 — Render Environment Variables

Go to your Render service → **Environment** → add the following:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your Supabase PostgreSQL URI |
| `JWT_SECRET` | Run `openssl rand -hex 32` and paste the output |
| `ODDS_API_KEY` | Your key from the-odds-api.com |
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` from Stripe Dashboard |
| `STRIPE_PUBLIC_KEY` | `pk_test_...` or `pk_live_...` from Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | `whsec_...` — see Step 4 below |
| `STRIPE_PRICE_ID_PRO` | Price ID for your Pro plan ($9.99/mo) |
| `STRIPE_PRICE_ID_PREMIUM` | Price ID for your Premium plan ($29.99/mo) |
| `FRONTEND_URL` | `https://arbitrage-hub.onrender.com` |

---

## Step 3 — Stripe Products Setup

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Create **"ArbitrageHub Pro"** → Recurring → $9.99/month → copy the Price ID
3. Create **"ArbitrageHub Premium"** → Recurring → $29.99/month → copy the Price ID
4. Paste both Price IDs into `STRIPE_PRICE_ID_PRO` and `STRIPE_PRICE_ID_PREMIUM` in Render

---

## Step 4 — Stripe Webhook Setup

1. Go to [Stripe Dashboard → Developers → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **Add endpoint**
3. Endpoint URL: `https://arbitrage-hub.onrender.com/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_failed`
5. Reveal the **Signing secret** (`whsec_...`) and add it to Render as `STRIPE_WEBHOOK_SECRET`

---

## Step 5 — Render Build & Start Commands

In your Render service settings:
- **Build command:** `pnpm install && pnpm build`
- **Start command:** `pnpm start`
- **Node version:** 20+

---

## Step 6 — Deploy

Push to GitHub — Render will auto-deploy. Confirm in Render logs:
```
✓ Server running on http://localhost:PORT/
  Environment : production
  Frontend URL: https://arbitrage-hub.onrender.com
```

If you see `[FATAL] Missing required environment variable: X`, that variable is missing from Render's environment panel.

---

## Security Notes

- Never commit `.env` to git (already in `.gitignore`)
- Never paste real API keys into chat, tickets, or documents
- Rotate any key that has been accidentally exposed
- Use `sk_test_` keys during testing, switch to `sk_live_` for real payments
