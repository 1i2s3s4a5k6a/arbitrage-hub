import { trpc } from "@/lib/trpc";
import { signOut, supabase } from "@/lib/supabase";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false } = options ?? {};
  const utils = trpc.useUtils();

  // Track the Supabase session so we know immediately whether the user
  // is logged in — before the trpc.auth.me query even resolves.
  const [session, setSession] = useState<Session | null | undefined>(undefined);

  useEffect(() => {
    // Hydrate the session from localStorage on first render
    supabase.auth.getSession().then(({ data }) => setSession(data.session));

    // Keep session in sync when the user logs in/out or the token refreshes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        // Invalidate the trpc.auth.me cache so the backend re-reads user data
        utils.auth.me.invalidate();
      }
    );
    return () => subscription.unsubscribe();
  }, [utils]);

  // Full user record (subscription tier, role, etc.) comes from our DB
  const meQuery = trpc.auth.me.useQuery(undefined, {
    enabled: Boolean(session),   // only fetch when logged in
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = useCallback(async () => {
    await signOut();
    utils.auth.me.setData(undefined, null);
    await utils.auth.me.invalidate();
  }, [utils]);

  // Redirect to home if the user is not authenticated
  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (session === undefined) return; // still loading
    if (session) return;              // logged in, no redirect needed
    window.location.href = "/";
  }, [redirectOnUnauthenticated, session]);

  const state = useMemo(() => ({
    user: meQuery.data ?? null,
    supabaseUser: session?.user ?? null,
    // Loading is true until we know the session state AND (if logged in)
    // the DB user has loaded
    loading:
      session === undefined ||
      (Boolean(session) && meQuery.isLoading),
    isAuthenticated: Boolean(session),
    error: meQuery.error ?? null,
  }), [session, meQuery.data, meQuery.isLoading, meQuery.error]);

  return {
    ...state,
    refresh: () => meQuery.refetch(),
    logout,
  };
}