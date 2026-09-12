import "server-only";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isDemoMode } from "@/lib/demo-mode";
import { uuidPattern, validMessage } from "@/lib/agent-workflow";
import type { BusinessContext, GrowthAgentContext, Period, Source } from "./contracts";
import { addSearchEvidence, addWebsiteEvidence, finiteMetric, metricFact, newEvidence, previousPeriod, sourceState } from "./evidence";
import { intentSources, routeGrowthIntent } from "./intent";

type Row = Record<string, unknown>;
const text = (value: unknown, max = 1000) => typeof value === "string" ? value.slice(0, max) : "";
const rows = (value: unknown): Row[] => Array.isArray(value) ? value.filter((r): r is Row => Boolean(r) && typeof r === "object" && !Array.isArray(r)) : [];
const columns: Record<Source, { table: string; select: string; order: string }> = {
  business: { table: "business_profiles", select: "description,target_customers,value_proposition,tone_of_voice,offers,important_claims,prohibited_claims,updated_at", order: "client_id" },
  website: { table: "seo_pages", select: "id,url,title,meta_description,h1,status_code,indexable,last_inspected_at", order: "id" },
  analytics: { table: "analytics_daily", select: "day,metrics,is_demo,source", order: "day" },
  search: { table: "search_console_daily", select: "id,day,query,page,metrics,is_demo,source", order: "id" },
  seo: { table: "seo_keywords", select: "id,keyword,target_url,current_position,previous_position,updated_at", order: "id" },
  history: { table: "reports", select: "id,month,analytics_summary,status", order: "month" },
};

/** Not a Server Action/API. The provider gate intentionally leaves this unconnected.
 * Operational tables retain staff-only RLS. This server-side projection is the
 * explicit narrow boundary for client analysis; never return its raw context to UI.
 */
export async function buildGrowthAgentContext(question: string, conversationId?: string, now = new Date()): Promise<GrowthAgentContext> {
  const started = Date.now();
  if (!validMessage(question) || (conversationId && !uuidPattern.test(conversationId))) throw new Error("Invalid analysis request.");
  if (isDemoMode()) throw new Error("Grounded analysis requires a real workspace.");
  const session = await createClient();
  const { data: { user }, error: authError } = await session.auth.getUser();
  if (authError || !user) throw new Error("Authentication required.");
  const membership = await session.from("client_members").select("client_id").eq("user_id", user.id).eq("role", "client").limit(2);
  if (membership.error || membership.data?.length !== 1) throw new Error("One client membership required.");
  const clientId = membership.data[0].client_id;
  const client = await session.from("clients").select("id,name,organization_id,lifecycle_status,is_demo,deleted_at").eq("id", clientId).single();
  if (client.error || !client.data || client.data.lifecycle_status === "archived") throw new Error("Client workspace unavailable.");
  if (client.data.is_demo || client.data.deleted_at) throw new Error("Grounded analysis requires a non-demo, current client.");
  let conversation: GrowthAgentContext["conversation"] = [];
  if (conversationId) {
    const topic = await session.from("agent_conversations").select("id").eq("id", conversationId).eq("client_id", clientId).single();
    if (topic.error || !topic.data) throw new Error("Conversation access denied.");
    const messages = await session.from("agent_messages").select("sender_type,body,created_at,id").eq("conversation_id", conversationId).in("sender_type", ["client", "staff"]).order("created_at", { ascending: false }).order("id").limit(6);
    if (messages.error) throw new Error("Conversation unavailable.");
    conversation = (messages.data ?? []).reverse().map(m => ({ role: m.sender_type as "client" | "staff", text: text(m.body, 600) }));
  }
  const intent = routeGrowthIntent(question), sources = intentSources[intent];
  const evidence = newEvidence();
  const business: BusinessContext = { name: text(client.data.name, 200), description: "", services: [], locations: [], targetCustomers: "", valueProposition: "", offers: "", importantClaims: "", prohibitedClaims: "", tone: "", verifiedFaqs: [] };
  const context: GrowthAgentContext = { scope: { userId: user.id, clientId, organizationId: client.data.organization_id }, question, intent, business, evidence, conversation, contextDurationMs: 0 };
  if (!sources.length) return { ...context, contextDurationMs: Date.now() - started };
  // Completed UTC days; never compare a partial current day with a complete day.
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) - 86400000);
  const period: Period = { from: new Date(end.getTime() - 27 * 86400000).toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
  const previous = previousPeriod(period);
  // Created only AFTER verified session + membership + conversation ownership.
  const db = createAdminClient();
  const selected = await Promise.all(sources.map(async source => {
    const spec = columns[source];
    let query = db.from(spec.table).select(spec.select).eq("client_id", clientId).order(spec.order, { ascending: source !== "history" }).limit(source === "history" ? 13 : 501);
    if (source === "analytics" || source === "search") query = query.gte("day", previous.from).lte("day", period.to).eq("is_demo", false).eq("source", source === "analytics" ? "google_analytics" : "search_console");
    if (source === "history") query = query.eq("status", "published");
    const result = await query;
    const data = rows(result.data), truncated = data.length >= (source === "history" ? 13 : 501);
    const state = sourceState(data.map(r => ({ day: text(r.day || r.last_inspected_at || r.updated_at || r.month) || undefined })), Boolean(result.error), truncated);
    evidence.sources[source] = state;
    if (result.error || truncated) {
      evidence.limitations.push(`${source}: ${result.error ? "source unavailable" : "bounded read exceeded; totals withheld rather than reporting a partial aggregate"}.`);
      return [source, []] as const;
    }
    return [source, data] as const;
  }));
  const data = Object.fromEntries(selected) as Partial<Record<Source, Row[]>>;
  const profile = data.business?.[0];
  if (profile) {
    // Never silently truncate safety constraints.
    if (text(profile.prohibited_claims, 10001).length > 4000) throw new Error("Business constraints exceed the supported context budget.");
    Object.assign(business, { description: text(profile.description), targetCustomers: text(profile.target_customers), valueProposition: text(profile.value_proposition), offers: text(profile.offers), importantClaims: text(profile.important_claims), prohibitedClaims: text(profile.prohibited_claims, 4000), tone: text(profile.tone_of_voice, 300) });
    const [services, locations, faqs] = await Promise.all([
      db.from("business_services").select("name").eq("client_id", clientId).eq("status", "active").order("id").limit(20),
      db.from("business_locations").select("name").eq("client_id", clientId).eq("status", "active").order("id").limit(20),
      db.from("business_faqs").select("question,answer").eq("client_id", clientId).eq("verified", true).order("id").limit(5),
    ]);
    if (services.error || locations.error || faqs.error) throw new Error("Business context unavailable.");
    business.services = (services.data ?? []).map(r => text(r.name, 150));
    business.locations = (locations.data ?? []).map(r => text(r.name, 150));
    business.verifiedFaqs = (faqs.data ?? []).map(r => ({ question: text(r.question, 200), answer: text(r.answer, 400) }));
  }
  for (const [key, label] of [["activeUsers", "GA4 daily active users"], ["sessions", "GA4 daily sessions"], ["screenPageViews", "GA4 daily page views"]] as const) {
    const fact = metricFact(`analytics.${key}`, "analytics", label, (data.analytics ?? []).map(r => ({ day: text(r.day), value: (r.metrics as Row | null)?.[key] })), period);
    if (fact) evidence.facts.push(fact);
  }
  if (sources.includes("analytics")) evidence.limitations.push("Daily GA4 totals come from a date-only property report. Page-level active users and sessions remain non-additive and are never summed to claim site totals.");
  if (sources.includes("search")) addSearchEvidence(evidence, (data.search ?? []).map(r => ({ day: text(r.day), page: text(r.page, 500), query: text(r.query, 200), clicks: (r.metrics as Row | null)?.clicks, impressions: (r.metrics as Row | null)?.impressions, position: (r.metrics as Row | null)?.position })), period);
  addWebsiteEvidence(evidence, data.website ?? []);
  for (const row of (data.seo ?? []).slice(0, 10)) {
    const value = finiteMetric(row.current_position);
    if (value === null || value <= 0) continue;
    evidence.facts.push({ id: `seo.${row.id}`, source: "seo", label: "Stored keyword position", value, unit: "position", period: null, previous: finiteMetric(row.previous_position), changePercent: null, calculation: "Stored ranking snapshot; date of ranking measurement is not certified by record updated_at.", query: text(row.keyword, 200), page: text(row.target_url, 500) || undefined });
  }
  for (const row of data.history ?? []) {
    const metrics = row.analytics_summary as Row | null;
    for (const key of ["users", "clicks"] as const) {
      const value = finiteMetric(metrics?.[key]);
      if (value !== null) evidence.facts.push({ id: `report.${row.id}.${key}`, source: "history", label: `Published report ${key}`, value, unit: "count", period: null, previous: null, changePercent: null, calculation: `Published report month ${text(row.month, 10)}; preserved as reported, not substituted for a missing daily observation.` });
    }
  }
  evidence.limitations.push("Default analysis covers the latest 28 completed UTC days; other requested periods need explicit period resolution before an answer.");
  return { ...context, contextDurationMs: Date.now() - started };
}
