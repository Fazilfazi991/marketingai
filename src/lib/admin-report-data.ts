import "server-only";
import { isDemoMode } from "@/lib/demo-mode";
import { createClient } from "@/lib/supabase/server";

export type AdminReport = { id: string; clientId: string; client: string; month: string; monthKey: string; summary: string; work: string[]; leads: number; leadChange: number; qualifiedLeads: number; users: number; userChange: number; clicks: number; clickChange: number; posts: number; nextFocus: string; status: "Draft" | "Needs review" | "Published"; source: "Demo" | "Connected"; updated: string };
export type AdminReportData = { reports: AdminReport[]; clients: Array<{ id: string; name: string }>; isDemo: boolean };
const demoReport: AdminReport = { id: "demo-report-1", clientId: "demo-abc", client: "ABC Interiors", month: "September 2026", monthKey: "2026-09", summary: "ABC Interiors generated 47 tracked enquiries this month, 35 qualified. WhatsApp was the largest source with 21.", work: ["9 social posts delivered", "1 SEO article drafted", "SEO review completed", "Website health check completed"], leads: 47, leadChange: 18, qualifiedLeads: 35, users: 1842, userChange: 12, clicks: 624, clickChange: 18, posts: 12, nextFocus: "Build visibility for villa renovation searches and strengthen project-led social proof using verified original photography.", status: "Needs review", source: "Demo", updated: "30 Sep · 18:10" };
const number = (value: unknown) => Number(value) || 0;

export async function loadAdminReports(): Promise<AdminReportData> {
  if (isDemoMode()) return { reports: [demoReport], clients: [{ id: "demo-abc", name: "ABC Interiors" }], isDemo: true };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in as a partner.");
  const [{ data: clients, error: clientError }, { data: rows, error: reportError }] = await Promise.all([
    supabase.from("clients").select("id,name").is("deleted_at", null).order("name"),
    supabase.from("reports").select("id,client_id,month,summary,work_completed,analytics_summary,next_month_focus,status,clients(name)").order("month", { ascending: false }).limit(120),
  ]);
  if (clientError) throw clientError;
  if (reportError) throw reportError;
  const reports = (rows ?? []).map(row => {
    const relation = row.clients as unknown as { name?: string } | { name?: string }[] | null;
    const client = Array.isArray(relation) ? relation[0]?.name : relation?.name;
    const metrics = (row.analytics_summary ?? {}) as Record<string, unknown>;
    const workValue = row.work_completed;
    const work = Array.isArray(workValue) ? workValue.map(String) : Object.values((workValue ?? {}) as Record<string, unknown>).map(String);
    const monthKey = String(row.month).slice(0, 7);
    return { id: String(row.id), clientId: String(row.client_id), client: client ?? "Client", month: new Intl.DateTimeFormat("en", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${row.month}T00:00:00Z`)), monthKey, summary: row.summary ?? "Report summary pending.", work, leads: number(metrics.leads), leadChange: number(metrics.lead_change), qualifiedLeads: number(metrics.qualified_leads), users: number(metrics.users), userChange: number(metrics.user_change), clicks: number(metrics.clicks), clickChange: number(metrics.click_change), posts: number(metrics.social_posts), nextFocus: row.next_month_focus ?? "Next month focus pending partner review.", status: (row.status === "published" ? "Published" : row.status === "needs_review" ? "Needs review" : "Draft") as AdminReport["status"], source: "Connected" as const, updated: "Growth1000 record" };
  });
  return { reports, clients: (clients ?? []).map(client => ({ id: String(client.id), name: String(client.name) })), isDemo: false };
}
