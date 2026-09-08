import { createHash, timingSafeEqual } from "node:crypto";
import { NextRequest } from "next/server";
import { parseLeadIngestion } from "@/lib/leads/ingestion";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const json = (body: Record<string, unknown>, status: number) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const matchesSecret = (received: string | null, expected: string | undefined) => {
  if (!received || !expected) return false;
  const left = createHash("sha256").update(received).digest(), right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
};

export async function POST(request: NextRequest) {
  if (!matchesSecret(request.headers.get("x-growth1000-key"), process.env.N8N_WEBHOOK_SECRET)) return json({ error: "Unauthorized" }, 401);
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 64_000) return json({ error: "Payload too large" }, 413);
  let payload: unknown;
  try { payload = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const parsed = parseLeadIngestion(payload);
  if (!parsed.ok) return json({ error: parsed.error }, 400);

  const lead = parsed.value;
  let supabase: ReturnType<typeof createAdminClient>;
  try { supabase = createAdminClient(); } catch { return json({ error: "Lead ingestion is not configured" }, 503); }
  const { data: client, error: clientError } = await supabase.from("clients").select("id").eq("id", lead.clientId).is("deleted_at", null).maybeSingle();
  if (clientError) return json({ error: "Unable to resolve client" }, 500);
  if (!client) return json({ error: "Client not found" }, 404);

  const row = { client_id: client.id, external_id: lead.eventId, source: lead.source, source_detail: lead.sourceDetail ?? null, name: lead.name ?? null, phone: lead.phone ?? null, email: lead.email ?? null, service: lead.service ?? null, location: lead.location ?? null, message: lead.message ?? null, qualification_summary: lead.qualificationSummary ?? null, lead_quality: lead.leadQuality, status: lead.status, ...(lead.createdAt ? { created_at: lead.createdAt } : {}) };
  const { data, error } = await supabase.from("leads").insert(row).select("id").single();
  if (!error) return json({ id: data.id, created: true }, 201);
  if (error.code !== "23505") return json({ error: "Unable to record lead" }, 500);
  const { data: existing, error: existingError } = await supabase.from("leads").select("id").eq("client_id", client.id).eq("source", lead.source).eq("external_id", lead.eventId).maybeSingle();
  if (existingError || !existing) return json({ error: "Unable to resolve duplicate lead" }, 500);
  return json({ id: existing.id, created: false }, 200);
}
