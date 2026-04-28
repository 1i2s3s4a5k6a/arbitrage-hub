import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "[Supabase] VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in Render environment variables."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Store session in localStorage so it survives page refreshes
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

/** Trigger GitHub OAuth login via Supabase */
export async function signInWithGitHub() {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      // After GitHub OAuth, Supabase redirects back here.
      // Must be added to Supabase → Authentication → URL Configuration → Redirect URLs
      redirectTo: `${window.location.origin}`,
    },
  });
  if (error) {
    console.error("[Supabase] GitHub login error:", error.message);
    throw error;
  }
}

/** Sign out of Supabase and clear the local session */
export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("[Supabase] Sign-out error:", error.message);
  }
}

/** Get the current access token (used to authenticate tRPC requests) */
export async function getAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}