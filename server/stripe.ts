/**
 * Stripe Payment Integration
 * Real implementation using the official Stripe SDK.
 *
 * All previous mock responses have been replaced with live API calls.
 * Requires: STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET env vars.
 */

import Stripe from "stripe";
import { ENV } from "./_core/env";
import {
  activateSubscription,
  cancelSubscriptionInDb,
  getUserByStripeCustomerId,
  setStripeCustomerId,
  getUserByOpenId,
} from "./db";

// ── Stripe client (lazy singleton) ─────────────────────────────────────────

let _stripe: Stripe | null = null;

function getStripe(): Stripe {
  if (_stripe) return _stripe;
  if (!ENV.stripeSecretKey) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }
  _stripe = new Stripe(ENV.stripeSecretKey, {
    apiVersion: "2025-06-30.basil",
    typescript: true,
  });
  return _stripe;
}

// ── Subscription plans ─────────────────────────────────────────────────────
// Replace stripePriceId values with your real Stripe Price IDs after creating
// products in the Stripe Dashboard (Products → Add product).

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  stripePriceId: string;
  features: string[];
}

export const SUBSCRIPTION_PLANS: Record<string, SubscriptionPlan> = {
  free: {
    id: "free",
    name: "Free",
    price: 0,
    stripePriceId: "", // Free tier has no Stripe price
    features: [
      "Limited odds (5 bookmakers)",
      "15-min delayed arbitrage",
      "Basic match center",
      "5 alerts/day",
    ],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 9.99,
    // Set STRIPE_PRICE_ID_PRO in env or replace this literal after creating
    // the price in your Stripe Dashboard.
    stripePriceId: process.env.STRIPE_PRICE_ID_PRO ?? "",
    features: [
      "Full odds (50+ bookmakers)",
      "Real-time arbitrage detection",
      "Full match center",
      "Unlimited alerts",
      "Advanced analytics",
    ],
  },
  premium: {
    id: "premium",
    name: "Premium",
    price: 29.99,
    stripePriceId: process.env.STRIPE_PRICE_ID_PREMIUM ?? "",
    features: [
      "Everything in Pro",
      "AI-powered predictions",
      "Sharp money signals",
      "API access",
      "Priority support",
    ],
  },
};

// ── Checkout ───────────────────────────────────────────────────────────────

export async function createCheckoutSession(
  userId: number,
  userEmail: string | null,
  planId: string,
  returnUrl: string
): Promise<{ sessionId: string; url: string } | null> {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan || plan.price === 0) return null; // Free tier needs no checkout

  if (!plan.stripePriceId) {
    throw new Error(
      `Stripe Price ID not configured for plan "${planId}". ` +
        "Set STRIPE_PRICE_ID_PRO / STRIPE_PRICE_ID_PREMIUM in your environment."
    );
  }

  const stripe = getStripe();

  // Create or retrieve a Stripe Customer so billing history is tracked
  const customer = await stripe.customers.create({
    email: userEmail ?? undefined,
    metadata: { userId: String(userId) },
  });

  await setStripeCustomerId(userId, customer.id);

  const session = await stripe.checkout.sessions.create({
    customer: customer.id,
    payment_method_types: ["card"],
    line_items: [{ price: plan.stripePriceId, quantity: 1 }],
    mode: "subscription",
    success_url: `${returnUrl}?session_id={CHECKOUT_SESSION_ID}&status=success`,
    cancel_url: `${returnUrl}?status=cancelled`,
    metadata: { userId: String(userId), planId },
    // Collect billing address for tax purposes
    billing_address_collection: "auto",
    // Allow promo codes
    allow_promotion_codes: true,
  });

  return { sessionId: session.id, url: session.url! };
}

// ── Subscription management ────────────────────────────────────────────────

export async function getSubscriptionStatus(
  stripeSubscriptionId: string
): Promise<{
  status: Stripe.Subscription.Status;
  currentPeriodEnd: Date;
} | null> {
  try {
    const stripe = getStripe();
    const sub = await stripe.subscriptions.retrieve(stripeSubscriptionId);
    return {
      status: sub.status,
      currentPeriodEnd: new Date((sub as any).current_period_end * 1000),
    };
  } catch (error) {
    console.error("[Stripe] Failed to retrieve subscription:", error);
    return null;
  }
}

export async function cancelSubscription(
  stripeSubscriptionId: string
): Promise<boolean> {
  try {
    const stripe = getStripe();
    // Cancel at period end so users keep access until their billing cycle ends
    await stripe.subscriptions.update(stripeSubscriptionId, {
      cancel_at_period_end: true,
    });
    return true;
  } catch (error) {
    console.error("[Stripe] Failed to cancel subscription:", error);
    return false;
  }
}

// ── Webhook handler ────────────────────────────────────────────────────────
// Called from server/_core/index.ts with the raw request body (Buffer).
// Stripe REQUIRES the raw body for signature verification — express.json()
// must NOT process this route.

export async function constructAndHandleWebhookEvent(
  rawBody: Buffer,
  signature: string
): Promise<{ success: boolean; message: string }> {
  if (!ENV.stripeWebhookSecret) {
    console.error("[Stripe] STRIPE_WEBHOOK_SECRET is not configured");
    return { success: false, message: "Webhook secret not configured" };
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, ENV.stripeWebhookSecret);
  } catch (err: any) {
    console.error("[Stripe] Webhook signature verification failed:", err.message);
    return { success: false, message: `Webhook error: ${err.message}` };
  }

  try {
    return await dispatchWebhookEvent(event);
  } catch (err) {
    console.error("[Stripe] Webhook handler threw:", err);
    return { success: false, message: "Webhook processing error" };
  }
}

async function dispatchWebhookEvent(
  event: Stripe.Event
): Promise<{ success: boolean; message: string }> {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") break;

      const userId = Number(session.metadata?.userId);
      const planId = session.metadata?.planId as "pro" | "premium";
      if (!userId || !planId) break;

      const stripe = getStripe();
      const sub = await stripe.subscriptions.retrieve(
        session.subscription as string
      );
      await activateSubscription(
        userId,
        sub.id,
        planId,
        new Date((sub as any).current_period_end * 1000)
      );
      console.log(`[Stripe] Subscription activated for user ${userId} (${planId})`);
      return { success: true, message: "Subscription activated" };
    }

    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      if (sub.status === "active") {
        const customer = await getStripeCustomer(sub.customer as string);
        if (!customer) break;
        const userId = Number(customer.metadata?.userId);
        const planId = getPlanIdFromSub(sub);
        if (userId && planId) {
          await activateSubscription(
            userId,
            sub.id,
            planId,
            new Date((sub as any).current_period_end * 1000)
          );
        }
      }
      return { success: true, message: "Subscription updated" };
    }

    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      await cancelSubscriptionInDb(sub.id);
      console.log(`[Stripe] Subscription cancelled: ${sub.id}`);
      return { success: true, message: "Subscription cancelled" };
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      console.warn(`[Stripe] Payment failed for customer: ${invoice.customer}`);
      return { success: true, message: "Payment failure noted" };
    }

    default:
      return { success: true, message: `Unhandled event: ${event.type}` };
  }

  return { success: true, message: "Event processed" };
}

// ── Internal helpers ───────────────────────────────────────────────────────

async function getStripeCustomer(
  customerId: string
): Promise<Stripe.Customer | null> {
  try {
    const stripe = getStripe();
    const c = await stripe.customers.retrieve(customerId);
    return c.deleted ? null : (c as Stripe.Customer);
  } catch {
    return null;
  }
}

function getPlanIdFromSub(sub: Stripe.Subscription): "pro" | "premium" | null {
  const priceId = sub.items.data[0]?.price?.id;
  for (const [id, plan] of Object.entries(SUBSCRIPTION_PLANS)) {
    if (plan.stripePriceId === priceId) {
      if (id === "pro" || id === "premium") return id;
    }
  }
  return null;
}

// ── Utilities ──────────────────────────────────────────────────────────────

export function getSubscriptionPlans(): SubscriptionPlan[] {
  return Object.values(SUBSCRIPTION_PLANS);
}

export function getPlanById(planId: string): SubscriptionPlan | null {
  return SUBSCRIPTION_PLANS[planId] ?? null;
}
