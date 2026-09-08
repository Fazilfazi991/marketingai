import { NextRequest } from "next/server";
import { createAIProvider, type GenerationContext } from "@/lib/ai/provider";
import { prepareSeoReview, type SeoReviewKeyword } from "@/lib/ai/seo-review";
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
  const runId = String(body.run_id ?? ""), clientId = String(body.client_id ?? "");
  if (!uuid.test(runId) || !uuid.test(clientId)) return json({ error: "run_id and client_id are required" }, 400);
  let supabase: ReturnType<typeof createAdminClient>;
  try { supabase = createAdminClient(); } catch { return json({ error: "Automation execution is not configured" }, 503); }
  const { data: run, error: runError } = await supabase.from("automation_runs").select("id,client_id,status,automation_jobs(workflow_key)").eq("id", runId).eq("client_id", clientId).maybeSingle();
  const job = run?.automation_jobs as unknown as { workflow_key?: string } | null;
  if (runError) return json({ error: "Unable to load automation run" }, 500);
  if (!run || job?.workflow_key !== "SEO_REVIEW") return json({ error: "Automation run does not match this request" }, 409);
  if (run.status === "succeeded") return json({ run_id: runId, status: "succeeded", replayed: true }, 200);
  if (!["queued", "running"].includes(run.status)) return json({ error: `Automation run is ${run.status}` }, 409);
  await supabase.from("automation_runs").update({ status: "running" }).eq("id", runId).in("status", ["queued", "running"]);
  try {
    const [clientResult, profileResult, servicesResult, locationsResult, faqsResult, keywordsResult, tasksResult] = await Promise.all([
      supabase.from("clients").select("name,industry,city,country").eq("id", clientId).is("deleted_at", null).single(),
      supabase.from("business_profiles").select("description,target_customers,value_proposition,tone_of_voice,offers,important_claims,prohibited_claims").eq("client_id", clientId).maybeSingle(),
      supabase.from("business_services").select("name").eq("client_id", clientId).eq("status", "active"),
      supabase.from("business_locations").select("name").eq("client_id", clientId).eq("status", "active"),
      supabase.from("business_faqs").select("question,answer").eq("client_id", clientId).eq("verified", true),
      supabase.from("seo_keywords").select("keyword,target_url,current_position,previous_position,priority,notes").eq("client_id", clientId).order("priority").limit(50),
      supabase.from("seo_tasks").select("title").eq("client_id", clientId).in("status", ["open", "in_progress", "awaiting_review"]),
    ]);
    const sourceError = [clientResult.error, profileResult.error, servicesResult.error, locationsResult.error, faqsResult.error, keywordsResult.error, tasksResult.error].find(Boolean);
    if (sourceError) throw sourceError;
    const profile = profileResult.data;
    const context: GenerationContext = { clientId, businessKnowledge: JSON.stringify({ client: clientResult.data, profile, locations: locationsResult.data, verifiedFaqs: faqsResult.data }), services: (servicesResult.data ?? []).map(item => item.name), offers: list(profile?.offers), prohibitedClaims: list(profile?.prohibited_claims) };
    const review = await prepareSeoReview(createAIProvider(), context, (keywordsResult.data ?? []) as SeoReviewKeyword[], (tasksResult.data ?? []).map(item => item.title ?? ""));
    const { data: createdTasks, error: insertError } = await supabase.from("seo_tasks").insert(review.tasks.map(task => ({ ...task, client_id: clientId }))).select("id");
    if (insertError) throw insertError;
    const { error: finishError } = await supabase.from("automation_runs").update({ status: "succeeded", finished_at: new Date().toISOString(), output_reference: { seo_tasks: review.tasks.length, boundary: "awaiting_review", provider: review.provider, model: review.model }, cost: review.estimatedCost }).eq("id", runId).in("status", ["queued", "running"]);
    if (finishError) {
      const createdIds = (createdTasks ?? []).map(item => item.id);
      if (createdIds.length) await supabase.from("seo_tasks").delete().in("id", createdIds).eq("client_id", clientId);
      throw finishError;
    }
    return json({ run_id: runId, status: "succeeded", seo_tasks: review.tasks.length, boundary: "awaiting_review" }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "SEO review failed";
    await supabase.from("automation_runs").update({ status: "failed", finished_at: new Date().toISOString(), output_reference: {} }).eq("id", runId);
    await supabase.from("automation_errors").insert({ run_id: runId, error_code: "SEO_REVIEW_FAILED", message, details: { retryable: true } });
    return json({ error: "SEO review failed", run_id: runId }, 500);
  }
}
