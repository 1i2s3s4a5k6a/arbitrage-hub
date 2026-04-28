import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

/**
 * Verify the Supabase JWT from the Authorization header.
 * Supabase signs tokens with HS256 using the JWT Secret from
 * Supabase → Settings → API → JWT Secret.
 *
 * On success: upserts the user into our DB (so new users are auto-created)
 * and returns the full user row.
 * On failure: returns null (request proceeds as unauthenticated).
 */
async function getUserFromRequest(
  req: CreateExpressContextOptions["req"]
): Promise<User | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return null;

  const token = authHeader.slice(7);
  const jwtSecret = process.env.SUPABASE_JWT_SECRET;

  if (!jwtSecret) {
    console.warn("[Auth] SUPABASE_JWT_SECRET is not set — all requests will be unauthenticated");
    return null;
  }

  try {
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    // Supabase JWT claims
    const supabaseUserId = payload.sub as string;       // UUID
    const email = payload.email as string | undefined;
    const name =
      (payload.user_metadata as any)?.full_name as string | undefined ??
      (payload.user_metadata as any)?.name as string | undefined;

    if (!supabaseUserId) return null;

    // Auto-create or update the user row in our DB on every request.
    // This is safe — upsertUser only updates non-sensitive fields.
    await db.upsertUser({
      openId: supabaseUserId,
      name: name ?? null,
      email: email ?? null,
      loginMethod: "github",
      lastSignedIn: new Date(),
    });

    return await db.getUserByOpenId(supabaseUserId) ?? null;
  } catch (err) {
    // Token expired, invalid signature, etc. — treat as unauthenticated
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  const user = await getUserFromRequest(opts.req);
  return { req: opts.req, res: opts.res, user };
}