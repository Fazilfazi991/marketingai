export function isDemoMode(env: Record<string, string | undefined> = process.env) {
  if (env.NEXT_PUBLIC_DEMO_MODE === "true") return true;
  if (env.NEXT_PUBLIC_DEMO_MODE === "false") return false;
  return env.NODE_ENV === "development"
    || !env.NEXT_PUBLIC_SUPABASE_URL
    || !env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}
