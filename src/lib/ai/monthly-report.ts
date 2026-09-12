import { leadingSource, percentChange, qualifiedLeadCount, sourceLabel, sumMetric, type LeadRow, type MetricRow } from "../report-metrics";
import type { AIProvider, GenerationContext } from "./provider";

export type ReportInputs = { analyticsNow: MetricRow[]; analyticsBefore: MetricRow[]; searchNow: MetricRow[]; searchBefore: MetricRow[]; leadsNow: LeadRow[]; leadsBefore: LeadRow[]; content: Array<{ content_kind: string; status: string }>; obligations: Array<{ label: string; delivered_quantity: number }> };

export async function prepareMonthlyReport(provider: AIProvider, context: GenerationContext, clientName: string, month: string, input: ReportInputs) {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("month must use YYYY-MM");
  const users = sumMetric(input.analyticsNow, "users", "activeUsers", "visitors"), previousUsers = sumMetric(input.analyticsBefore, "users", "activeUsers", "visitors");
  const clicks = sumMetric(input.searchNow, "clicks", "organicClicks"), previousClicks = sumMetric(input.searchBefore, "clicks", "organicClicks");
  const leads = input.leadsNow.length, qualifiedLeads = qualifiedLeadCount(input.leadsNow), topSource = leadingSource(input.leadsNow);
  const posts = input.content.filter(item => item.content_kind === "social_post" && item.status === "published").length;
  const blogs = input.content.filter(item => item.content_kind === "blog" && item.status === "published").length;
  const work = input.obligations.filter(item => Number(item.delivered_quantity) > 0).map(item => `${item.delivered_quantity} ${item.label.toLowerCase()} delivered`);
  const analyticsSummary = { observations_verified: users !== null || clicks !== null, leads, lead_change: percentChange(leads, input.leadsBefore.length), qualified_leads: qualifiedLeads, users, user_change: percentChange(users, previousUsers), clicks, click_change: percentChange(clicks, previousClicks), social_posts: posts, blogs };
  if (users === null && clicks === null && !leads && !posts && !blogs && !work.length) throw new Error("No observations or delivered work available for this report.");
  const facts = { clientName, month, ...analyticsSummary, largestLeadSource: topSource ? { label: sourceLabel(topSource.source), count: topSource.count } : null, workCompleted: work };
  const generated = await provider.generateMonthlyReport(context, JSON.stringify({ instruction: "Write a concise plain-language client result summary using only these facts. Null means unavailable, never zero. Do not invent causes, percentages, claims or recommendations.", facts }));
  const summary = generated.data.trim();
  if (!summary) throw new Error("AI provider returned an empty report summary");
  const nextFocus = topSource ? `Build on ${sourceLabel(topSource.source)}, review lead quality and follow-up outcomes, and prioritize the search and content work most likely to increase qualified enquiries.` : "Strengthen lead capture and tracking, then prioritize the search and content work most likely to increase qualified enquiries.";
  return { summary, work, analyticsSummary, nextFocus, provider: generated.provider, model: generated.model, estimatedCost: generated.usage?.estimatedCost ?? 0 };
}
