import { NextRequest } from "next/server";
import { prepareMonthlyReport } from "@/lib/ai/monthly-report";
import { createAIProvider, type GenerationContext } from "@/lib/ai/provider";
import type { LeadRow, MetricRow } from "@/lib/report-metrics";
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
  if (!run || job?.workflow_key !== "MONTHLY_REPORT" || inputMonth !== month) return json({ error: "Automation run does not match this request" }, 409);
  if (run.status === "succeeded") return json({ run_id: runId, status: "succeeded", replayed: true }, 200);
  if (!["queued", "running"].includes(run.status)) return json({ error: `Automation run is ${run.status}` }, 409);
  await supabase.from("automation_runs").update({ status: "running" }).eq("id", runId).in("status", ["queued", "running"]);
  let previousReport: Record<string, unknown> | null = null, savedReportId = "";
  try {
    const start = `${month}-01`, endDate = new Date(`${month}-01T00:00:00Z`), previousDate = new Date(`${month}-01T00:00:00Z`);
    endDate.setUTCMonth(endDate.getUTCMonth() + 1); previousDate.setUTCMonth(previousDate.getUTCMonth() - 1);
    const end = endDate.toISOString(), previous = previousDate.toISOString().slice(0, 10);
    const results = await Promise.all([
      supabase.from("clients").select("name,industry,city,country").eq("id", clientId).is("deleted_at", null).single(),
      supabase.from("business_profiles").select("description,target_customers,value_proposition,tone_of_voice,offers,important_claims,prohibited_claims").eq("client_id", clientId).maybeSingle(),
      supabase.from("business_services").select("name").eq("client_id", clientId).eq("status", "active"),
      supabase.from("analytics_daily").select("metrics").eq("client_id", clientId).gte("day", start).lt("day", end),
      supabase.from("analytics_daily").select("metrics").eq("client_id", clientId).gte("day", previous).lt("day", start),
      supabase.from("search_console_daily").select("metrics").eq("client_id", clientId).gte("day", start).lt("day", end),
      supabase.from("search_console_daily").select("metrics").eq("client_id", clientId).gte("day", previous).lt("day", start),
      supabase.from("leads").select("source,lead_quality,status").eq("client_id", clientId).gte("created_at", `${start}T00:00:00Z`).lt("created_at", end),
      supabase.from("leads").select("source,lead_quality,status").eq("client_id", clientId).gte("created_at", `${previous}T00:00:00Z`).lt("created_at", `${start}T00:00:00Z`),
      supabase.from("content_items").select("content_kind,status").eq("client_id", clientId).eq("month", start),
      supabase.from("delivery_periods").select("delivery_obligations(label,delivered_quantity)").eq("client_id", clientId).eq("month", start).maybeSingle(),
      supabase.from("reports").select("id,summary,work_completed,analytics_summary,next_month_focus,status,asset_id").eq("client_id", clientId).eq("month", start).maybeSingle(),
    ]);
    const sourceError = results.map(result => result.error).find(Boolean);
    if (sourceError) throw sourceError;
    const [clientResult, profileResult, servicesResult, analyticsNow, analyticsBefore, searchNow, searchBefore, leadsNow, leadsBefore, content, period, priorReport] = results.map(result => result.data);
    if (!clientResult) throw new Error("Client not found");
    previousReport = priorReport as Record<string, unknown> | null;
    const profile = profileResult as { offers?: string | null; prohibited_claims?: string | null } | null;
    const context: GenerationContext = { clientId, businessKnowledge: JSON.stringify({ client: clientResult, profile }), services: ((servicesResult ?? []) as Array<{ name: string }>).map(item => item.name), offers: list(profile?.offers), prohibitedClaims: list(profile?.prohibited_claims) };
    const obligations = ((((period as { delivery_obligations?: unknown } | null)?.delivery_obligations) ?? []) as Array<{ label: string; delivered_quantity: number }>);
    const prepared = await prepareMonthlyReport(createAIProvider(), context, String((clientResult as { name: string }).name), month, { analyticsNow: (analyticsNow ?? []) as MetricRow[], analyticsBefore: (analyticsBefore ?? []) as MetricRow[], searchNow: (searchNow ?? []) as MetricRow[], searchBefore: (searchBefore ?? []) as MetricRow[], leadsNow: (leadsNow ?? []) as LeadRow[], leadsBefore: (leadsBefore ?? []) as LeadRow[], content: (content ?? []) as Array<{ content_kind: string; status: string }>, obligations });
    const { data: report, error: reportError } = await supabase.from("reports").upsert({ client_id: clientId, month: start, summary: prepared.summary, work_completed: prepared.work, analytics_summary: prepared.analyticsSummary, next_month_focus: prepared.nextFocus, status: "needs_review" }, { onConflict: "client_id,month" }).select("id").single();
    if (reportError) throw reportError;
    savedReportId = String(report.id);
    const { error: finishError } = await supabase.from("automation_runs").update({ status: "succeeded", finished_at: new Date().toISOString(), output_reference: { report_id: report.id, boundary: "needs_review", provider: prepared.provider, model: prepared.model }, cost: prepared.estimatedCost }).eq("id", runId).in("status", ["queued", "running"]);
    if (finishError) throw finishError;
    return json({ run_id: runId, status: "succeeded", report_id: report.id, boundary: "needs_review" }, 200);
  } catch (error) {
    if (savedReportId) {
      if (previousReport) await supabase.from("reports").update({ summary: previousReport.summary, work_completed: previousReport.work_completed, analytics_summary: previousReport.analytics_summary, next_month_focus: previousReport.next_month_focus, status: previousReport.status, asset_id: previousReport.asset_id }).eq("id", savedReportId).eq("client_id", clientId);
      else await supabase.from("reports").delete().eq("id", savedReportId).eq("client_id", clientId);
    }
    const message = error instanceof Error ? error.message : "Monthly report preparation failed";
    await supabase.from("automation_runs").update({ status: "failed", finished_at: new Date().toISOString(), output_reference: {} }).eq("id", runId);
    await supabase.from("automation_errors").insert({ run_id: runId, error_code: "MONTHLY_REPORT_FAILED", message, details: { retryable: true } });
    return json({ error: "Monthly report preparation failed", run_id: runId }, 500);
  }
}
