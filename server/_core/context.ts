import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { createClient } from "@supabase/supabase-js";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/**
 * Verify the Supabase JWT using the Supabase admin client.
 * This works for both HS256 and ES256 tokens automatically.
 */
async function getUserFromRequest(
  req: CreateExpressContextOptions["req"]
): Promise<User | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.warn("[Auth] VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not set");
    return null;
  }

  try {
    // Use the service role client to verify the user token
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data.user) return null;

    const supabaseUser = data.user;
    const email = supabaseUser.email;
    const name =
      supabaseUser.user_metadata?.full_name ??
      supabaseUser.user_metadata?.name ??
      null;

    // Auto-create or update the user row in our DB
    await db.upsertUser({
      openId: supabaseUser.id,
      name,
      email,
      loginMethod: supabaseUser.app_metadata?.provider ?? "unknown",
      lastSignedIn: new Date(),
    });

    return (await db.getUserByOpenId(supabaseUser.id)) ?? null;
  } catch (err) {
    console.error("[Auth] Token verification failed:", err);
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const user = await getUserFromRequest(opts.req);
  return { req: opts.req, res: opts.res, user };
}