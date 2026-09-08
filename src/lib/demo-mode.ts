export function isDemoMode(env: Record<string, string | undefined> = process.env) {
  // Production must never expose demo identities or data, even if a shared
  // preview variable is accidentally enabled in Vercel.
  if (env.VERCEL_ENV === "production") return false;
  if (env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
  if (env.NEXT_PUBLIC_DEMO_MODE === "false") return false;
  return env.NODE_ENV === "development"
    || !env.NEXT_PUBLIC_SUPABASE_URL
    || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}
