import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { constructAndHandleWebhookEvent } from "../stripe";

// ── Required environment variable check ───────────────────────────────────
// Fail fast at startup rather than at runtime so Render surfaces the error
// immediately in deployment logs instead of mysterious 500s in production.

const REQUIRED_ENV_VARS = ["DATABASE_URL", "ODDS_API_KEY", "SUPABASE_JWT_SECRET"];
for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    console.error(`\n[FATAL] Missing required environment variable: ${key}`);
    console.error("Set this in Render → Environment → Add Environment Variable\n");
    process.exit(1);
  }
}

if (process.env.NODE_ENV === "production") {
  const PROD_REQUIRED = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"];
  for (const key of PROD_REQUIRED) {
    if (!process.env[key]) {
      console.warn(`[WARN] ${key} is not set — Stripe payments will not work`);
    }
  }
}

// ── Port helpers ───────────────────────────────────────────────────────────

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(port, () => server.close(() => resolve(true)));
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) return port;
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

// ── Server bootstrap ───────────────────────────────────────────────────────

async function startServer() {
  const app = express();
  const server = createServer(app);

  const isProduction = process.env.NODE_ENV === "production";
  const frontendUrl =
    process.env.FRONTEND_URL ?? "https://arbitrage-hub.onrender.com";

  // ── Security headers (helmet) ────────────────────────────────────────────
  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "https:"],
              connectSrc: ["'self'", "https://api.stripe.com"],
              frameSrc: ["https://js.stripe.com", "https://hooks.stripe.com"],
            },
          }
        : false, // relax CSP in development (Vite HMR needs it)
      crossOriginEmbedderPolicy: false,
    })
  );

  // ── CORS ─────────────────────────────────────────────────────────────────
  app.use(
    cors({
      origin: isProduction
        ? [frontendUrl]
        : ["http://localhost:5173", "http://localhost:3000"],
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "Cookie"],
    })
  );

  // ── Stripe webhook MUST be registered before express.json() ──────────────
  // Stripe signature verification requires the raw body as a Buffer.
  app.post(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      if (!sig || typeof sig !== "string") {
        res.status(400).send("Missing stripe-signature header");
        return;
      }

      const result = await constructAndHandleWebhookEvent(req.body as Buffer, sig);
      res.status(result.success ? 200 : 400).json(result);
    }
  );

  // ── Body parsers ─────────────────────────────────────────────────────────
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ limit: "10mb", extended: true }));

  // ── Rate limiting ─────────────────────────────────────────────────────────
  // General API: 120 requests per 15 minutes per IP
  const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 120,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many requests, please try again later." },
  });
  app.use("/api/", generalLimiter);

  // Auth endpoints: stricter limit to slow brute force
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many auth attempts, please try again later." },
  });
  app.use("/api/oauth/", authLimiter);

  // ── Application routes ────────────────────────────────────────────────────
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({ router: appRouter, createContext })
  );

  // ── Frontend serving ──────────────────────────────────────────────────────
  if (!isProduction) {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ── Start listening ───────────────────────────────────────────────────────
  const preferredPort = parseInt(process.env.PORT ?? "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} busy — using ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`✓ Server running on http://localhost:${port}/`);
    console.log(`  Environment : ${process.env.NODE_ENV ?? "development"}`);
    console.log(`  Frontend URL: ${frontendUrl}`);
  });
}

startServer().catch((err) => {
  console.error("[FATAL] Server failed to start:", err);
  process.exit(1);
});
