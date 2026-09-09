import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchesWebhookSecret } from "@/lib/webhook-auth";
import { generateMonthlySocialContent } from "@/lib/social-generation-service";

export const runtime = "nodejs";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: Record<string, unknown>, status: number) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(request: NextRequest) {
  if (!matchesWebhookSecret(request.headers.get("x-growth1000-key"), process.env.N8N_WEBHOOK_SECRET)) return json({ error: "Unauthorized" }, 401);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const runId = String(body.run_id ?? ""), clientId = String(body.client_id ?? ""), month = String(body.month ?? "");
  if (!uuid.test(runId) || !uuid.test(clientId) || !/^\d{4}-\d{2}$/.test(month)) return json({ error: "run_id, client_id and month are required" }, 400);
  let supabase: ReturnType<typeof createAdminClient>;
  try { supabase = createAdminClient(); } catch { return json({ error: "Automation execution is not configured" }, 503); }
  const { data: run, error: runError } = await supabase.from("automation_runs").select("id,client_id,status,input_reference,automation_jobs(workflow_key)").eq("id", runId).eq("client_id", clientId).maybeSingle();
  const relation = run?.automation_jobs as unknown as { workflow_key?: string } | null;
  const inputMonth = (run?.input_reference as Record<string, unknown> | null)?.month;
  if (runError) return json({ error: "Unable to load automation run" }, 500);
  if (!run || relation?.workflow_key !== "MONTHLY_SOCIAL" || inputMonth !== month) return json({ error: "Automation run does not match this request" }, 409);
  if (run.status === "succeeded") return json({ run_id: runId, status: "succeeded", replayed: true }, 200);
  if (!["queued", "running"].includes(run.status)) return json({ error: `Automation run is ${run.status}` }, 409);
  const { error: startError } = await supabase.from("automation_runs").update({ status: "running" }).eq("id", runId).in("status", ["queued", "running"]);
  if (startError) return json({ error: "Unable to start automation run" }, 500);
  try {
    const result = await generateMonthlySocialContent(supabase, runId, clientId, month, request.headers.get("x-vercel-oidc-token"));
    return json({ run_id: runId, status: "succeeded", content_records: result.count, boundary: "needs_review" }, 200);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Monthly social preparation failed";
    console.error("MONTHLY_SOCIAL_FAILED", message);
    await supabase.from("automation_runs").update({ status: "failed", finished_at: new Date().toISOString(), output_reference: {} }).eq("id", runId);
    await supabase.from("automation_errors").insert({ run_id: runId, error_code: "MONTHLY_SOCIAL_FAILED", message, details: { retryable: true } });
    return json({ error: "Monthly social preparation failed", run_id: runId }, 500);
  }
}
