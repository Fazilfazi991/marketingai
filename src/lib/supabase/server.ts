import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { measuredFetch } from "@/lib/performance";
export async function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    throw new Error("Supabase is not configured. Demo mode remains available.");
  const store = await cookies();
  return createServerClient(url, key, {
    global: { fetch: measuredFetch },
    cookies: {
      getAll: () => store.getAll(),
      setAll(items) {
        try {
          items.forEach(({ name, value, options }) =>
            store.set(name, value, options),
          );
        } catch {
          /* Server Components cannot write cookies. */
        }
      },
    },
  });
}
