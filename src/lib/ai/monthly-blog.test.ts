import { describe, expect, it } from "vitest";
import { DemoAIProvider } from "./demo-provider";
import { prepareMonthlyBlogs } from "./monthly-blog";

const context = { clientId: "demo", businessKnowledge: "ABC Interiors is verified.", services: ["Villa Renovation"], offers: [], prohibitedClaims: ["Prices"] };
describe("monthly blog preparation", () => {
  it("creates the configured number of unique reviewable drafts", async () => {
    const result = await prepareMonthlyBlogs(new DemoAIProvider(), context, "2026-10", 2, [{ keyword: "villa renovation dubai", intent: "Commercial" }, { keyword: "kitchen renovation dubai", intent: "Commercial" }]);
    expect(result.blogs).toHaveLength(2);
    expect(result.blogs[0].targetKeyword).toBe("villa renovation dubai");
    expect(result.blogs[0].body.length).toBeGreaterThan(500);
    expect(result.blogs[0].seoMetadata.description.length).toBeLessThanOrEqual(156);
  });
  it("refuses to invent missing topics", async () => {
    await expect(prepareMonthlyBlogs(new DemoAIProvider(), context, "2026-10", 2, [{ keyword: "villa renovation dubai" }])).rejects.toThrow("verified blog topics");
  });
});
