import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { parseLeadIngestion } from "@/lib/leads/ingestion";
import {
  matchesSiteSecret,
  normalizeOrigin,
  obviousSpam,
  originMatches,
} from "@/lib/leads/site-auth";

export const runtime = "nodejs";
const corsHeaders = (origin?: string | null) => ({
  "Cache-Control": "no-store",
  Vary: "Origin",
  ...(origin ? { "Access-Control-Allow-Origin": origin } : {}),
});
const json = (
  body: Record<string, unknown>,
  status: number,
  origin?: string | null,
) =>
  Response.json(body, {
    status,
    headers: corsHeaders(origin),
  });
export async function OPTIONS(request: NextRequest) {
  const requestOrigin = normalizeOrigin(request.headers.get("origin"));
  if (!requestOrigin)
    return new Response(null, { status: 400, headers: corsHeaders() });
  const supabase = createAdminClient();
  const { data: sites, error } = await supabase
    .from("client_sites")
    .select("origin")
    .eq("status", "active");
  if (error)
    return new Response(null, { status: 500, headers: corsHeaders() });
  const allowed = (sites ?? []).some((site) =>
    originMatches(String(site.origin ?? ""), requestOrigin),
  );
  if (!allowed)
    return new Response(null, { status: 403, headers: corsHeaders() });
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(requestOrigin),
      "Access-Control-Allow-Headers":
        "content-type,x-growth1000-site,x-growth1000-site-key",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Max-Age": "86400",
    },
  });
}

export async function POST(request: NextRequest) {
  const size = Number(request.headers.get("content-length") ?? 0);
  if (size > 64_000) return json({ error: "Payload too large" }, 413);
  const siteIdentifier = request.headers.get("x-growth1000-site")?.trim() ?? "",
    siteKey = request.headers.get("x-growth1000-site-key") ?? "";
  if (!siteIdentifier || !siteKey) return json({ error: "Unauthorized" }, 401);
  const supabase = createAdminClient();
  const { data: site, error: siteError } = await supabase
    .from("client_sites")
    .select("id,client_id,origin,secret_hash,status")
    .eq("site_identifier", siteIdentifier)
    .maybeSingle();
  if (siteError) return json({ error: "Unable to validate site" }, 500);
  const requestOrigin = request.headers.get("origin");
  const allowedOrigin = originMatches(site?.origin ?? null, requestOrigin)
    ? normalizeOrigin(requestOrigin)
    : null;
  if (
    !site ||
    site.status !== "active" ||
    !matchesSiteSecret(siteKey, String(site.secret_hash))
  )
    return json({ error: "Unauthorized" }, 401, allowedOrigin);
  if (!originMatches(site.origin, requestOrigin))
    return json({ error: "Origin not allowed" }, 403);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, 400, allowedOrigin);
  }
  const record =
    body && typeof body === "object" && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : {};
  if (obviousSpam(record))
    return typeof record.company_website === "string" &&
      record.company_website.trim()
      ? json({ accepted: true }, 202, allowedOrigin)
      : json({ error: "Message rejected" }, 400, allowedOrigin);
  const parsed = parseLeadIngestion({ ...record, client_id: site.client_id });
  if (!parsed.ok) return json({ error: parsed.error }, 400, allowedOrigin);
  const lead = parsed.value,
    campaign =
      record.campaign &&
      typeof record.campaign === "object" &&
      !Array.isArray(record.campaign)
        ? record.campaign
        : {};
  const row = {
    client_id: site.client_id,
    external_id: lead.eventId,
    source: lead.source,
    source_detail: lead.sourceDetail ?? null,
    name: lead.name ?? null,
    phone: lead.phone ?? null,
    email: lead.email ?? null,
    service: lead.service ?? null,
    location: lead.location ?? null,
    message: lead.message ?? null,
    qualification_summary: lead.qualificationSummary ?? null,
    lead_quality: lead.leadQuality,
    status: lead.status,
    source_url:
      typeof record.url === "string" ? record.url.slice(0, 2000) : null,
    referrer:
      typeof record.referrer === "string"
        ? record.referrer.slice(0, 2000)
        : null,
    campaign,
    raw_metadata:
      record.metadata && typeof record.metadata === "object"
        ? record.metadata
        : {},
    ...(lead.createdAt ? { created_at: lead.createdAt } : {}),
  };
  const { data, error } = await supabase
    .from("leads")
    .insert(row)
    .select("id")
    .single();
  if (error?.code === "23505") {
    const { data: existing } = await supabase
      .from("leads")
      .select("id")
      .eq("client_id", site.client_id)
      .eq("source", lead.source)
      .eq("external_id", lead.eventId)
      .maybeSingle();
    return existing
      ? json({ id: existing.id, created: false }, 200, allowedOrigin)
      : json({ error: "Unable to resolve duplicate" }, 500, allowedOrigin);
  }
  if (error)
    return json({ error: "Unable to record lead" }, 500, allowedOrigin);
  await supabase
    .from("client_sites")
    .update({ last_lead_at: new Date().toISOString() })
    .eq("id", site.id);
  return json({ id: data.id, created: true }, 201, allowedOrigin);
}
