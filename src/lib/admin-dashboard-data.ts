import "server-only";

import { deliverables, tasks } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/demo-mode";
import { createClient } from "@/lib/supabase/server";

export type AdminDashboardData = {
  firstName: string;
  periodLabel: string;
  stats: Array<{ label: string; value: string; detail: string }>;
  delivery: Array<{ label: string; value: number; total: number; accent: string }>;
  attention: Array<{ client: string; slug: string; title: string; detail: string; tone: string }>;
  isDemo: boolean;
};

const demoData: AdminDashboardData = {
  firstName: "Fazil",
  periodLabel: "September delivery",
  stats: [
    { label: "Active clients", value: "10", detail: "+2 this quarter" },
    { label: "Onboarding", value: "2", detail: "1 due this week" },
    { label: "Needs attention", value: "3", detail: "2 access issues" },
    { label: "Tracked leads", value: "126", detail: "+18% vs last month" },
  ],
  delivery: deliverables,
  attention: tasks.map((task, index) => ({ client: task.client, slug: task.client.toLowerCase().replaceAll(" ", "-"), title: task.title, detail: task.due, tone: index === 2 ? "risk" : "warn" })),
  isDemo: true,
};

const titleCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());

export async function loadAdminDashboard(): Promise<AdminDashboardData> {
  if (isDemoMode()) return demoData;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in as a partner.");
  const now = new Date(), currentStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)), nextStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)), previousStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const currentMonth = currentStart.toISOString().slice(0, 10);
  const [{ data: profile }, { data: clients, error: clientError }, { data: leads, error: leadError }, { data: periods, error: periodError }] = await Promise.all([
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    supabase.from("clients").select("id,name,slug,lifecycle_status,health_status").is("deleted_at", null),
    supabase.from("leads").select("client_id,created_at").gte("created_at", previousStart.toISOString()).lt("created_at", nextStart.toISOString()),
    supabase.from("delivery_periods").select("id").eq("month", currentMonth),
  ]);
  for (const error of [clientError, leadError, periodError]) if (error) throw error;
  const clientRows = clients ?? [], ids = clientRows.map(client => String(client.id)), periodIds = (periods ?? []).map(period => String(period.id));
  const [{ data: obligations, error: obligationError }, { data: accessRows, error: accessError }, { data: blockedTasks, error: taskError }] = await Promise.all([
    periodIds.length ? supabase.from("delivery_obligations").select("deliverable_type,label,promised_quantity,delivered_quantity").in("delivery_period_id", periodIds) : Promise.resolve({ data: [], error: null }),
    ids.length ? supabase.from("client_access").select("client_id,access_type,status").in("client_id", ids).neq("status", "connected").limit(20) : Promise.resolve({ data: [], error: null }),
    ids.length ? supabase.from("tasks").select("client_id,title,status,due_at,priority").in("client_id", ids).in("status", ["blocked", "awaiting_internal_review"]).order("due_at").limit(10) : Promise.resolve({ data: [], error: null }),
  ]);
  for (const error of [obligationError, accessError, taskError]) if (error) throw error;
  const currentLeads = (leads ?? []).filter(lead => new Date(lead.created_at) >= currentStart).length;
  const previousLeads = (leads ?? []).filter(lead => { const date = new Date(lead.created_at); return date >= previousStart && date < currentStart; }).length;
  const leadGrowth = previousLeads ? Math.round((currentLeads - previousLeads) / previousLeads * 100) : null;
  const deliveryMap = new Map<string, { label: string; value: number; total: number }>();
  for (const obligation of obligations ?? []) {
    const key = String(obligation.deliverable_type), existing = deliveryMap.get(key) ?? { label: String(obligation.label), value: 0, total: 0 };
    existing.value += Number(obligation.delivered_quantity); existing.total += Number(obligation.promised_quantity); deliveryMap.set(key, existing);
  }
  const accents = ["violet", "blue", "green", "amber"];
  const clientFor = (clientId: unknown) => clientRows.find(client => client.id === clientId);
  const attention = [
    ...(accessRows ?? []).map(row => { const client = clientFor(row.client_id); return { client: client?.name ?? "Client", slug: client?.slug ?? "", title: `${titleCase(String(row.access_type))} access ${titleCase(String(row.status)).toLowerCase()}`, detail: "Access", tone: "warn" }; }),
    ...(blockedTasks ?? []).map(row => { const client = clientFor(row.client_id); return { client: client?.name ?? "Client", slug: client?.slug ?? "", title: String(row.title), detail: titleCase(String(row.status)), tone: row.priority === "high" ? "risk" : "warn" }; }),
  ].slice(0, 5);
  const active = clientRows.filter(client => client.lifecycle_status === "active").length, onboarding = clientRows.filter(client => client.lifecycle_status === "onboarding").length, needsAttention = clientRows.filter(client => client.health_status !== "healthy").length;
  return {
    firstName: profile?.full_name?.split(" ")[0] || "Partner",
    periodLabel: new Intl.DateTimeFormat("en", { month: "long", timeZone: "UTC" }).format(currentStart) + " delivery",
    stats: [
      { label: "Active clients", value: String(active), detail: `${clientRows.length} total clients` },
      { label: "Onboarding", value: String(onboarding), detail: onboarding ? "Setup in progress" : "No clients waiting" },
      { label: "Needs attention", value: String(needsAttention), detail: `${(accessRows ?? []).length} access issues` },
      { label: "Tracked leads", value: String(currentLeads), detail: leadGrowth === null ? "No previous baseline" : `${leadGrowth >= 0 ? "+" : ""}${leadGrowth}% vs last month` },
    ],
    delivery: [...deliveryMap.values()].slice(0, 4).map((item, index) => ({ ...item, accent: accents[index] })),
    attention,
    isDemo: false,
  };
}
