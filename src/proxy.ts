import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { canOpenPath, homeForRole, resolveAppRole } from "@/lib/access-control";
import { isDemoMode } from "@/lib/demo-mode";
import { measuredFetch, timed } from "@/lib/performance";
export async function proxy(request: NextRequest) {
  if (isDemoMode()) return NextResponse.next();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL,
    key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    return NextResponse.redirect(
      new URL("/?error=Sign-in%20is%20temporarily%20unavailable", request.url),
    );
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    global: { fetch: measuredFetch },
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(items) {
        items.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        items.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  const go = (path: string) => {
    const result = NextResponse.redirect(new URL(path, request.url));
    response.cookies.getAll().forEach((cookie) => result.cookies.set(cookie));
    result.headers.set("Cache-Control", "private, no-store");
    return result;
  };
  try {
    const { data, error } = await timed("proxy.session", () =>
      supabase.auth.getClaims(),
    );
    const userId = data?.claims?.sub;
    if (error || !userId) return go("/?error=Please%20sign%20in");
    const [org, client] = await timed("proxy.membership", () =>
      Promise.all([
        supabase
          .from("organization_members")
          .select("role")
          .eq("user_id", userId)
          .eq("status", "active")
          .limit(1)
          .maybeSingle(),
        supabase
          .from("client_members")
          .select("client_id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle(),
      ]),
    );
    if (org.error || client.error)
      return go(
        "/?error=Workspace%20temporarily%20unavailable.%20Please%20try%20again.",
      );
    const role = resolveAppRole(org.data?.role, Boolean(client.data));
    if (!role) return go("/?error=No%20active%20Growth1000%20membership");
    if (!canOpenPath(role, request.nextUrl.pathname))
      return go(homeForRole(role));
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch {
    return go("/?error=Sign-in%20check%20timed%20out.%20Please%20try%20again.");
  }
}
export const config = {
  matcher: ["/admin/:path*", "/staff/:path*", "/client/:path*"],
};
