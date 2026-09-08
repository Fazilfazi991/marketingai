import { describe, expect, it } from "vitest";
import { answerDashboardQuestion, answerDashboardQuestionDeterministically, buildDashboardAssistantContext, inferDashboardRange, type DashboardAssistantContext, type DashboardAnswerProvider } from "./dashboard-assistant";
import type { ClientResultsData } from "./client-results";

const context: DashboardAssistantContext = {
  client: { name: "ABC Interiors" }, period: { key: "7d", label: "Last 7 days", start: "2026-09-24", end: "2026-09-30", comparison: "previous equivalent period", updatedAt: "now" },
  leads: { total: 17, qualified: 13, general: 4, growthPercent: 18, sources: [{ key: "whatsapp", label: "WhatsApp", count: 8, sharePercent: 47, growthPercent: 14 }], trend: [] },
  website: { visitors: 300, newVisitors: 200, pageViews: 600, whatsappClicks: 20, formSubmissions: 4, visitorGrowthPercent: 12, formConversionPercent: 1.3 },
  google: { organicClicks: 90, impressions: 1400, keywordsImproved: 6, topTenKeywords: 3, keywordMovements: [{ keyword: "villa renovation", previousPosition: 14, currentPosition: 9, improvement: 5 }] },
  ai: { websiteQualifiedLeads: 5, whatsappQualifiedLeads: 8, websiteConversations: 30, whatsappConversations: 45 },
  topPages: [{ page: "/services", visitors: 120, leads: 4 }], seoOpportunities: [], workCompleted: ["SEO review completed"], nextFocus: ["Improve the services page"], issues: [], reportHistory: [], summary: "", demo: true,
};

describe("dashboard assistant grounding", () => {
  it("uses an explicitly requested comparison range", () => expect(inferDashboardRange("Compare the last 7 days with the previous 7 days", "month")).toBe("7d"));
  it("answers source questions from the selected context", () => expect(answerDashboardQuestionDeterministically(context, "How many leads came from WhatsApp?")).toContain("8 tracked leads"));
  it("does not confuse perform with website form", () => expect(answerDashboardQuestionDeterministically(context, "How did we perform this period?")).toContain("17 leads"));
  it("answers traffic comparisons without implying causation", () => expect(answerDashboardQuestionDeterministically(context, "Is traffic improving?")).toContain("increased 12%"));
  it("finds the greatest verified keyword movement", () => expect(answerDashboardQuestionDeterministically(context, "Which keyword improved most?")).toContain("14 to 9"));
  it("refuses to invent an unavailable metric", () => expect(answerDashboardQuestionDeterministically(context, "What was our bounce rate?")).toContain("isn’t currently connected"));
  it("falls back safely when an AI provider fails", async () => {
    const provider: DashboardAnswerProvider = { answer: async () => { throw new Error("offline"); } };
    await expect(answerDashboardQuestion({ context, question: "Are leads improving?", role: "client", provider })).resolves.toContain("17 tracked leads");
  });
  it("rejects provider answers containing unsupported numbers", async () => {
    const provider: DashboardAnswerProvider = { answer: async () => "Revenue increased 999%." };
    await expect(answerDashboardQuestion({ context, question: "How are leads?", role: "client", provider })).resolves.not.toContain("999");
  });
});

describe("dashboard context security", () => {
  it("normalizes summaries without exposing lead contact records", () => {
    const data = { clientName: "Client A", periodLabel: "This month", rangeKey: "month", rangeStart: "2026-09-01", rangeEnd: "2026-09-30", updatedAt: "now", isDemo: false, leads: { total: 1, qualified: 1, growth: null, sources: [{ key: "whatsapp", label: "WhatsApp", value: 1, tone: "green", growth: null }], trend: [], latest: [{ id: "private-id", name: "Private Person", service: "Secret project", source: "WhatsApp", createdAt: "today" }] }, traffic: { visitors: 0, newVisitors: 0, pageViews: 0, whatsappClicks: 0, formSubmissions: 0, growth: null }, search: { clicks: 0, impressions: 0, improved: 0, topTen: 0, keywords: [] }, ai: { websiteConversations: 0, websiteLeads: 0, whatsappConversations: 0, whatsappLeads: 0 }, work: [], topPages: [], opportunities: [], nextFocus: [], summary: "", report: null, reports: [] } satisfies ClientResultsData;
    const serialized = JSON.stringify(buildDashboardAssistantContext(data));
    expect(serialized).toContain("Client A");
    expect(serialized).not.toContain("Private Person");
    expect(serialized).not.toContain("private-id");
    expect(serialized).not.toContain("Secret project");
  });
});
