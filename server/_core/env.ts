/**
 * Central environment variable config.
 * All process.env reads go through here — never access process.env directly
 * elsewhere so missing variables are caught at startup (see index.ts).
 */
export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // The Odds API — https://the-odds-api.com
  oddsApiKey: process.env.ODDS_API_KEY ?? "",

  // Stripe — https://dashboard.stripe.com/apikeys
  stripePublicKey: process.env.STRIPE_PUBLIC_KEY ?? "",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  // Set this after creating a webhook in the Stripe dashboard
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",

  // Your deployed frontend origin (used for CORS + Stripe return URLs)
  frontendUrl: process.env.FRONTEND_URL ?? "https://arbitrage-hub.onrender.com",
};
