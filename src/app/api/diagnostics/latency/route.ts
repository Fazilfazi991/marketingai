import { NextResponse } from "next/server";

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview")
    return new Response(null, { status: 404 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key)
    return NextResponse.json(
      { error: "Preview configuration missing" },
      { status: 503 },
    );
  const start = performance.now();
  try {
    // Public health endpoint only; no database records or credentials returned.
    const response = await fetch(`${url}/auth/v1/health`, {
      headers: { apikey: key },
      cache: "no-store",
      signal: AbortSignal.timeout(5000),
    });
    return NextResponse.json(
      {
        region: process.env.VERCEL_REGION,
        upstreamMs: Math.round(performance.now() - start),
        status: response.status,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json(
      {
        region: process.env.VERCEL_REGION,
        upstreamMs: Math.round(performance.now() - start),
        error: "Health request timed out or failed",
      },
      { status: 503 },
    );
  }
}
