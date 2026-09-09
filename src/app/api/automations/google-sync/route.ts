import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { matchesWebhookSecret } from "@/lib/webhook-auth";
import { syncGoogleClient } from "@/lib/google/sync";

export const runtime = "nodejs";
const json = (body: Record<string, unknown>, status = 200) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

async function isAuthorized(request: NextRequest) {
  if (
    matchesWebhookSecret(
      request.headers.get("x-growth1000-key"),
      process.env.N8N_WEBHOOK_SECRET,
    )
  )
    return true;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return false;
    const { data: membership } = await supabase
      .from("organization_members")
      .select("user_id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();
    return Boolean(membership);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAuthorized(request))) return json({ error: "Unauthorized" }, 401);
  let body: unknown = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }
  const input =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  const requested =
    typeof input.client_id === "string" ? input.client_id : null;
  const to =
    typeof input.to === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.to)
      ? input.to
      : isoDay(new Date(Date.now() - 86400000));
  const from =
    typeof input.from === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input.from)
      ? input.from
      : isoDay(new Date(Date.now() - 31 * 86400000));
  if (from > to) return json({ error: "from must be on or before to" }, 400);
  const supabase = createAdminClient();
  let ids: string[] = [];
  if (requested) {
    if (!/^[0-9a-f-]{36}$/i.test(requested))
      return json({ error: "client_id must be a UUID" }, 400);
    ids = [requested];
  } else {
    const { data, error } = await supabase
      .from("clients")
      .select("id")
      .eq("is_demo", false)
      .eq("lifecycle_status", "active")
      .is("deleted_at", null);
    if (error) return json({ error: "Unable to list active clients" }, 500);
    ids = (data ?? []).map((row) => String(row.id));
  }
  const output = [] as Array<Record<string, unknown>>;
  for (const clientId of ids) {
    try {
      output.push({
        client_id: clientId,
        status: "succeeded",
        sources: await syncGoogleClient(supabase, clientId, { from, to }),
      });
    } catch (error) {
      output.push({
        client_id: clientId,
        status: "failed",
        error: error instanceof Error ? error.message : "Sync failed",
      });
    }
  }
  return json(
    {
      from,
      to,
      clients: output,
      status: output.some((item) => item.status === "failed")
        ? "completed_with_errors"
        : "succeeded",
    },
    output.some((item) => item.status === "failed") ? 207 : 200,
  );
}
