import type { ClientResultsData } from "./client-results";

export type DashboardAssistantContext = Pick<ClientResultsData, "periodLabel" | "updatedAt" | "leads" | "traffic" | "search" | "ai" | "topPages" | "opportunities" | "work" | "nextFocus" | "summary">;

const change = (value: number | null) => value === null ? "There is not enough previous-period data to calculate a comparison." : `${value >= 0 ? "up" : "down"} ${Math.abs(value)}% from the previous period`;

export function answerDashboardQuestion(context: DashboardAssistantContext, question: string) {
  const q = question.toLowerCase();
  const period = `For ${context.periodLabel}`;
  const topSource = context.leads.sources.slice().sort((a, b) => b.value - a.value)[0];
  const source = context.leads.sources.find(item => q.includes(item.label.toLowerCase()) || (q.includes("form") && item.key === "website_form") || (q.includes("chatbot") && item.key === "website_chatbot"));
  if (source) return `${period}, ${source.label} generated ${source.value} tracked ${source.value === 1 ? "lead" : "leads"}. That is ${change(source.growth)}.`;
  if (q.includes("traffic") || q.includes("visitor")) return `${period}, your website recorded ${context.traffic.visitors.toLocaleString()} visitors and ${context.traffic.pageViews.toLocaleString()} page views. Traffic was ${change(context.traffic.growth)}.`;
  if (q.includes("ranking") || q.includes("keyword")) {
    if (!context.search.keywords.length) return `${period}, I don’t have enough verified keyword-position data to assess rankings yet.`;
    const improving = context.search.keywords.filter(item => item.current < item.previous);
    return `${period}, ${context.search.improved} tracked keywords improved and ${context.search.topTen} are in the top 10. ${improving[0] ? `${improving[0].keyword} moved from position ${improving[0].previous} to ${improving[0].current}.` : "No improvement is visible in the selected keyword sample."}`;
  }
  if (q.includes("page") || q.includes("performing best")) {
    const page = context.topPages[0];
    return page ? `${period}, ${page.page} was the top recorded page with ${page.visitors.toLocaleString()} visitors and ${page.leads} attributable ${page.leads === 1 ? "lead" : "leads"}.` : `${period}, I don’t have enough page-level data to identify a top-performing page.`;
  }
  if (q.includes("opportunit") || q.includes("focus") || q.includes("next")) {
    const priorities = context.nextFocus.length ? context.nextFocus.slice(0, 2) : context.opportunities.slice(0, 2).map(item => `${item.keyword} at position ${item.position}`);
    return priorities.length ? `${period}, the clearest next priorities are: ${priorities.join("; ")}.` : `${period}, no verified next-focus recommendation is available yet.`;
  }
  if (q.includes("complete") || q.includes("work") || q.includes("deliver")) return context.work.length ? `${period}, Growth1000 completed: ${context.work.join("; ")}.` : `${period}, no completed work has been published in the dashboard yet.`;
  if (q.includes("website ai") || q.includes("chatbot") || q.includes("whatsapp ai") || q.includes("conversation")) return `${period}, website AI generated ${context.ai.websiteLeads} qualified leads from ${context.ai.websiteConversations} conversations, while WhatsApp generated ${context.ai.whatsappLeads} qualified leads from ${context.ai.whatsappConversations} conversations.`;
  if (q.includes("why") && (q.includes("down") || q.includes("lower") || q.includes("drop"))) return `${period}, leads were ${change(context.leads.growth)}. The dashboard shows the change, but it does not contain enough attribution data to prove why it happened. ${topSource ? `${topSource.label} remained the largest source with ${topSource.value} leads.` : "No leading source is available."}`;
  if (q.includes("lead") || q.includes("channel") || q.includes("source")) return `${period}, you generated ${context.leads.total} tracked leads, including ${context.leads.qualified} qualified. Leads were ${change(context.leads.growth)}.${topSource ? ` ${topSource.label} was the strongest channel with ${topSource.value}.` : ""}`;
  if (q.includes("perform") || q.includes("improv") || q.includes("summary") || q.includes("how did")) return `${period}, you generated ${context.leads.total} leads (${context.leads.qualified} qualified), with leads ${change(context.leads.growth)}. Website traffic was ${change(context.traffic.growth)}, with ${context.search.clicks.toLocaleString()} organic clicks. ${topSource ? `${topSource.label} was your leading source.` : ""}`;
  return `${period}, I can answer questions about leads, channels, traffic, rankings, top pages, completed work, and next priorities. I don’t have enough dashboard data to answer that specific question confidently.`;
}
