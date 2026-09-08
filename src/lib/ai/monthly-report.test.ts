import { describe, expect, it } from "vitest";
import { DemoAIProvider } from "./demo-provider";
import { prepareMonthlyReport } from "./monthly-report";

const context = { clientId: "demo", businessKnowledge: "ABC Interiors", services: [], offers: [], prohibitedClaims: [] };
describe("monthly report preparation", () => {
  it("calculates lead-first comparisons and grounds the summary", async () => {
    const result = await prepareMonthlyReport(new DemoAIProvider(), context, "ABC Interiors", "2026-09", { analyticsNow: [{ metrics: { users: 120 } }], analyticsBefore: [{ metrics: { users: 100 } }], searchNow: [{ metrics: { clicks: 60 } }], searchBefore: [{ metrics: { clicks: 50 } }], leadsNow: [{ source: "whatsapp", lead_quality: "qualified", status: "qualified" }, { source: "website_form", lead_quality: "unqualified", status: "new" }], leadsBefore: [{ source: "website_form", lead_quality: "unqualified", status: "new" }], content: [{ content_kind: "social_post", status: "published" }], obligations: [{ label: "Social posts", delivered_quantity: 1 }] });
    expect(result.analyticsSummary).toMatchObject({ leads: 2, lead_change: 100, qualified_leads: 1, users: 120, user_change: 20, clicks: 60, click_change: 20 });
    expect(result.summary).toContain("2 tracked enquiries");
    expect(result.summary).toContain("WhatsApp");
    expect(result.work).toEqual(["1 social posts delivered"]);
  });
});
