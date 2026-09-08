export function isDemoMode() {
  return process.env.NEXT_PUBLIC_DEMO_MODE === "true"
    || process.env.NODE_ENV === "development"
    || !process.env.NEXT_PUBLIC_SUPABASE_URL
    || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
}
