"use server";

import { revalidatePath } from "next/cache";
import { leadingSource, percentChange, qualifiedLeadCount, sourceLabel, sumMetric, type LeadRow, type MetricRow } from "@/lib/report-metrics";
import { createClient } from "@/lib/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

async function adminContext(clientId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in as a partner.");
  const { data: membership } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).eq("role", "admin").eq("status", "active").limit(1).maybeSingle();
  if (!membership) throw new Error("An active partner membership is required.");
  const { data: client } = await supabase.from("clients").select("id,name").eq("id", clientId).eq("organization_id", membership.organization_id).is("deleted_at", null).maybeSingle();
  if (!client) throw new Error("Client not found.");
  return { supabase, client };
}

export async function publishReport(id: string, clientId: string): Promise<Result> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return { ok: false, error: "Invalid report." };
  try {
    const { supabase } = await adminContext(clientId);
    const { error } = await supabase.from("reports").update({ status: "published" }).eq("id", id).eq("client_id", clientId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/reports");
    revalidatePath("/client");
    revalidatePath("/client/reports");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to publish the report." };
  }
}

export async function regenerateReport(clientId: string, month: string): Promise<Result> {
  if (!/^\d{4}-\d{2}$/.test(month)) return { ok: false, error: "Choose a valid report month." };
  try {
    const { supabase, client } = await adminContext(clientId);
    const start = `${month}-01`;
    const endDate = new Date(`${start}T00:00:00Z`);
    const previousDate = new Date(`${start}T00:00:00Z`);
    endDate.setUTCMonth(endDate.getUTCMonth() + 1);
    previousDate.setUTCMonth(previousDate.getUTCMonth() - 1);
    const end = endDate.toISOString();
    const previous = previousDate.toISOString().slice(0, 10);
    const queries = await Promise.all([
      supabase.from("analytics_daily").select("metrics").eq("client_id", clientId).gte("day", start).lt("day", end),
      supabase.from("analytics_daily").select("metrics").eq("client_id", clientId).gte("day", previous).lt("day", start),
      supabase.from("search_console_daily").select("metrics").eq("client_id", clientId).gte("day", start).lt("day", end),
      supabase.from("search_console_daily").select("metrics").eq("client_id", clientId).gte("day", previous).lt("day", start),
      supabase.from("leads").select("source,lead_quality,status").eq("client_id", clientId).gte("created_at", `${start}T00:00:00Z`).lt("created_at", end),
      supabase.from("leads").select("source,lead_quality,status").eq("client_id", clientId).gte("created_at", `${previous}T00:00:00Z`).lt("created_at", `${start}T00:00:00Z`),
      supabase.from("content_items").select("content_kind,status").eq("client_id", clientId).eq("month", start),
      supabase.from("delivery_periods").select("id,delivery_obligations(label,delivered_quantity)").eq("client_id", clientId).eq("month", start).maybeSingle(),
    ]);
    const failed = queries.find(query => query.error);
    if (failed?.error) return { ok: false, error: failed.error.message };
    const [analyticsNow, analyticsBefore, searchNow, searchBefore, leadsNow, leadsBefore, content, period] = queries.map(query => query.data);
    const users = sumMetric(analyticsNow as MetricRow[] | null, "users", "activeUsers", "visitors");
    const previousUsers = sumMetric(analyticsBefore as MetricRow[] | null, "users", "activeUsers", "visitors");
    const clicks = sumMetric(searchNow as MetricRow[] | null, "clicks", "organicClicks");
    const previousClicks = sumMetric(searchBefore as MetricRow[] | null, "clicks", "organicClicks");
    const currentLeads = (leadsNow ?? []) as LeadRow[];
    const priorLeads = (leadsBefore ?? []) as LeadRow[];
    const leads = currentLeads.length;
    const qualifiedLeads = qualifiedLeadCount(currentLeads);
    const topSource = leadingSource(currentLeads);
    const posts = ((content ?? []) as Array<{ content_kind: string; status: string }>).filter(item => item.content_kind === "social_post" && item.status === "published").length;
    const obligations = (((period as { delivery_obligations?: unknown } | null)?.delivery_obligations ?? []) as Array<{ label: string; delivered_quantity: number }>);
    const work = obligations.filter(item => item.delivered_quantity > 0).map(item => `${item.delivered_quantity} ${item.label.toLowerCase()} delivered`);
    const sourceSentence = topSource ? ` ${sourceLabel(topSource.source)} was the largest source with ${topSource.count}.` : "";
    const summary = `${client.name} generated ${leads.toLocaleString()} tracked ${leads === 1 ? "enquiry" : "enquiries"} this month, ${qualifiedLeads.toLocaleString()} qualified.${sourceSentence} The website recorded ${users.toLocaleString()} users and ${clicks.toLocaleString()} organic search clicks.`;
    const nextFocus = topSource ? `Build on ${sourceLabel(topSource.source)}, review lead quality and follow-up outcomes, and prioritize the search and content work most likely to increase qualified enquiries.` : "Strengthen lead capture and tracking, then prioritize the search and content work most likely to increase qualified enquiries.";
    const { error } = await supabase.from("reports").upsert({
      client_id: clientId,
      month: start,
      summary,
      work_completed: work,
      analytics_summary: { leads, lead_change: percentChange(leads, priorLeads.length), qualified_leads: qualifiedLeads, users, user_change: percentChange(users, previousUsers), clicks, click_change: percentChange(clicks, previousClicks), social_posts: posts },
      next_month_focus: nextFocus,
      status: "needs_review",
    }, { onConflict: "client_id,month" });
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/reports");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to regenerate the report." };
  }
}
