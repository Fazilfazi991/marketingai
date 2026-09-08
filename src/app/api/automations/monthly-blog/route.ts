import { NextRequest } from "next/server";
import { prepareMonthlyBlogs, type BlogCandidate } from "@/lib/ai/monthly-blog";
import { createAIProvider, type GenerationContext } from "@/lib/ai/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchesWebhookSecret } from "@/lib/webhook-auth";

export const runtime = "nodejs";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: Record<string, unknown>, status: number) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const list = (value: string | null | undefined) => value?.split(/\r?\n|,/).map(item => item.trim()).filter(Boolean) ?? [];

export async function POST(request: NextRequest) {
  if (!matchesWebhookSecret(request.headers.get("x-growth1000-key"), process.env.N8N_WEBHOOK_SECRET)) return json({ error: "Unauthorized" }, 401);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const runId = String(body.run_id ?? ""), clientId = String(body.client_id ?? ""), month = String(body.month ?? "");
  if (!uuid.test(runId) || !uuid.test(clientId) || !/^\d{4}-\d{2}$/.test(month)) return json({ error: "run_id, client_id and month are required" }, 400);
  let supabase: ReturnType<typeof createAdminClient>;
  try { supabase = createAdminClient(); } catch { return json({ error: "Automation execution is not configured" }, 503); }
  const { data: run, error: runError } = await supabase.from("automation_runs").select("id,client_id,status,input_reference,automation_jobs(workflow_key)").eq("id", runId).eq("client_id", clientId).maybeSingle();
  const job = run?.automation_jobs as unknown as { workflow_key?: string } | null, inputMonth = (run?.input_reference as Record<string, unknown> | null)?.month;
  if (runError) return json({ error: "Unable to load automation run" }, 500);
  if (!run || job?.workflow_key !== "MONTHLY_BLOG" || inputMonth !== month) return json({ error: "Automation run does not match this request" }, 409);
  if (run.status === "succeeded") return json({ run_id: runId, status: "succeeded", replayed: true }, 200);
  if (!["queued", "running"].includes(run.status)) return json({ error: `Automation run is ${run.status}` }, 409);
  await supabase.from("automation_runs").update({ status: "running" }).eq("id", runId).in("status", ["queued", "running"]);
  try {
    const [clientResult, profileResult, servicesResult, locationsResult, faqsResult, keywordsResult, existingResult, scopeResult] = await Promise.all([
      supabase.from("clients").select("name,industry,city,country").eq("id", clientId).is("deleted_at", null).single(),
      supabase.from("business_profiles").select("description,target_customers,value_proposition,tone_of_voice,offers,important_claims,prohibited_claims").eq("client_id", clientId).maybeSingle(),
      supabase.from("business_services").select("name").eq("client_id", clientId).eq("status", "active"),
      supabase.from("business_locations").select("name").eq("client_id", clientId).eq("status", "active"),
      supabase.from("business_faqs").select("question,answer").eq("client_id", clientId).eq("verified", true),
      supabase.from("seo_keywords").select("keyword,intent,priority,current_position").eq("client_id", clientId).order("priority").order("current_position", { ascending: true, nullsFirst: false }).limit(30),
      supabase.from("content_items").select("target_keyword").eq("client_id", clientId).eq("content_kind", "blog").eq("month", `${month}-01`),
      supabase.from("client_service_scopes").select("monthly_quantity").eq("client_id", clientId).eq("service_key", "blogs").eq("enabled", true).maybeSingle(),
    ]);
    const sourceError = [clientResult.error, profileResult.error, servicesResult.error, locationsResult.error, faqsResult.error, keywordsResult.error, existingResult.error, scopeResult.error].find(Boolean);
    if (sourceError) throw sourceError;
    if (!clientResult.data) throw new Error("Client not found");
    if (!scopeResult.data) throw new Error("Blog service is not enabled for this client");
    const profile = profileResult.data, existing = new Set((existingResult.data ?? []).map(item => item.target_keyword?.toLowerCase()).filter(Boolean));
    const services = (servicesResult.data ?? []).map(item => item.name), locations = (locationsResult.data ?? []).map(item => item.name);
    const keywordCandidates = (keywordsResult.data ?? []).filter(item => !existing.has(item.keyword.toLowerCase())) as BlogCandidate[];
    const serviceCandidates = services.flatMap(service => (locations.length ? locations : [clientResult.data.city ?? ""]).filter(Boolean).map(location => ({ keyword: `${service.toLowerCase()} ${location}`.trim(), intent: "Commercial" }))).filter(item => !existing.has(item.keyword.toLowerCase()));
    const context: GenerationContext = { clientId, businessKnowledge: JSON.stringify({ client: clientResult.data, profile, locations: locationsResult.data, verifiedFaqs: faqsResult.data }), services, offers: list(profile?.offers), prohibitedClaims: list(profile?.prohibited_claims) };
    const prepared = await prepareMonthlyBlogs(createAIProvider(), context, month, Number(scopeResult.data.monthly_quantity || 2), [...keywordCandidates, ...serviceCandidates]);
    const { data: created, error: insertError } = await supabase.from("content_items").insert(prepared.blogs.map(blog => ({ client_id: clientId, content_kind: "blog", month: `${month}-01`, topic: blog.topic, target_keyword: blog.targetKeyword, concept: blog.brief, body: blog.body, seo_metadata: blog.seoMetadata, status: "internal_review" }))).select("id");
    if (insertError) throw insertError;
    const { error: finishError } = await supabase.from("automation_runs").update({ status: "succeeded", finished_at: new Date().toISOString(), output_reference: { blog_records: prepared.blogs.length, boundary: "internal_review", provider: prepared.provider, model: prepared.model }, cost: prepared.estimatedCost }).eq("id", runId).in("status", ["queued", "running"]);
    if (finishError) { const ids = (created ?? []).map(item => item.id); if (ids.length) await supabase.from("content_items").delete().in("id", ids).eq("client_id", clientId); throw finishError; }
    return json({ run_id: runId, status: "succeeded", blog_records: prepared.blogs.length, boundary: "internal_review" }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Monthly blog preparation failed";
    await supabase.from("automation_runs").update({ status: "failed", finished_at: new Date().toISOString(), output_reference: {} }).eq("id", runId);
    await supabase.from("automation_errors").insert({ run_id: runId, error_code: "MONTHLY_BLOG_FAILED", message, details: { retryable: true } });
    return json({ error: "Monthly blog preparation failed", run_id: runId }, 500);
  }
}
