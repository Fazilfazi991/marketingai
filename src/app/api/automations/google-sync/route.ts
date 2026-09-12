import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { matchesWebhookSecret } from "@/lib/webhook-auth";
import { syncGoogleClient } from "@/lib/google/sync";
import { uuidPattern } from "@/lib/agent-workflow";

export const runtime = "nodejs";
const json = (body: Record<string, unknown>, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const isoDay = (date: Date) => date.toISOString().slice(0, 10);

async function authorizedScope(request: NextRequest) {
  const webhook = request.headers.get("x-growth1000-key");
  if (webhook !== null) {
    // A global webhook secret is not global tenant authorization.
    const org = process.env.GOOGLE_SYNC_ORGANIZATION_ID;
    if (!matchesWebhookSecret(webhook, process.env.N8N_WEBHOOK_SECRET) || !org || !uuidPattern.test(org)) return null;
    return { db: createAdminClient(), organizations: [org] };
  }
  if (request.headers.get("origin") !== request.nextUrl.origin) return null;
  const db = await createClient();
  const { data: { user }, error } = await db.auth.getUser();
  if (error || !user) return null;
  const membership = await db.from("organization_members").select("organization_id").eq("user_id", user.id).eq("role", "admin").eq("status", "active").limit(101);
  if (membership.error || !membership.data?.length || membership.data.length > 100) return null;
  // Session RLS remains active for all admin reads/writes, not service-role bypass.
  return { db, organizations: membership.data.map(row => String(row.organization_id)) };
}

export async function POST(request: NextRequest) {
  try {
    const scope = await authorizedScope(request);
    if (!scope) return json({ error: "Unauthorized" }, 401);
    let input: Record<string, unknown>;
    try {
      const raw = await request.text();
      if (raw.length > 2000) return json({ error: "Request too large" }, 413);
      input = JSON.parse(raw);
      if (!input || typeof input !== "object" || Array.isArray(input) || Object.keys(input).some(k => !["client_id", "from", "to"].includes(k))) throw new Error();
    } catch { return json({ error: "Invalid request" }, 400); }
    if (input.client_id !== undefined && (typeof input.client_id !== "string" || !uuidPattern.test(input.client_id))) return json({ error: "client_id must be a UUID" }, 400);
    const to = input.to ?? isoDay(new Date(Date.now() - 86400000));
    const from = input.from ?? isoDay(new Date(Date.now() - 90 * 86400000));
    const validDay = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v + "T00:00:00Z")) && isoDay(new Date(v + "T00:00:00Z")) === v;
    if (!validDay(from) || !validDay(to) || from > to || to >= isoDay(new Date()) || (Date.parse(to) - Date.parse(from)) / 86400000 >= 90) return json({ error: "Choose at most 90 completed days" }, 400);
    let query = scope.db.from("clients").select("id,organization_id").in("organization_id", scope.organizations).eq("is_demo", false).eq("lifecycle_status", "active").is("deleted_at", null).order("id").limit(201);
    if (input.client_id) query = query.eq("id", input.client_id);
    const { data: clients, error } = await query;
    if (error) return json({ error: "Unable to resolve authorized clients" }, 503);
    if (input.client_id && clients?.length !== 1) return json({ error: "Client unavailable or unauthorized" }, 403);
    if ((clients?.length ?? 0) > 200) return json({ error: "Select an individual client" }, 413);
    const output = [];
    for (const client of clients ?? []) {
      try {
        const sources = await syncGoogleClient(scope.db, client.id, { from, to }, process.env, client.organization_id);
        output.push({ client_id: client.id, status: "succeeded", sources });
      } catch {
        output.push({ client_id: client.id, status: "failed", error: "Google sync failed. Review server-side integration status." });
      }
    }
    const failed = output.some(row => row.status === "failed");
    return json({ from, to, clients: output, status: failed ? "completed_with_errors" : "succeeded" }, failed ? 207 : 200);
  } catch { return json({ error: "Unable to authorize or complete sync" }, 503); }
}
