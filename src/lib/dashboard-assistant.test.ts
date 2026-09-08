import { describe, expect, it } from "vitest";
import { answerDashboardQuestion, type DashboardAssistantContext } from "./dashboard-assistant";

const context = { periodLabel: "Last 7 days", updatedAt: "now", leads: { total: 17, qualified: 13, growth: 18, sources: [{ key: "whatsapp", label: "WhatsApp", value: 8, tone: "green", growth: 14 }], trend: [], latest: [] }, traffic: { visitors: 300, newVisitors: 200, pageViews: 600, whatsappClicks: 20, formSubmissions: 4, growth: 12 }, search: { clicks: 90, impressions: 1400, improved: 6, topTen: 3, keywords: [{ keyword: "villa renovation", previous: 14, current: 9 }] }, ai: { websiteLeads: 5, whatsappLeads: 8, websiteConversations: 30, whatsappConversations: 45 }, topPages: [{ page: "/services", visitors: 120, leads: 4 }], opportunities: [], work: ["SEO review completed"], nextFocus: ["Improve the services page"], summary: "" } as DashboardAssistantContext;

describe("dashboard assistant", () => {
  it("answers source questions from current context", () => expect(answerDashboardQuestion(context, "How many leads came from WhatsApp?")).toContain("8 tracked leads"));
  it("answers traffic comparison questions", () => expect(answerDashboardQuestion(context, "Is traffic improving?")).toContain("up 12%"));
  it("does not invent unsupported causes", () => expect(answerDashboardQuestion(context, "Why did leads drop?")).toContain("does not contain enough attribution data to prove why"));
});
