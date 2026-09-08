import { describe, expect, it } from "vitest";
import { DemoAIProvider } from "./demo-provider";
import { prepareSeoReview } from "./seo-review";

const context = { clientId: "demo", businessKnowledge: "Verified business", services: ["Villa Renovation"], offers: [], prohibitedClaims: ["Unverified claims"] };
describe("SEO review preparation", () => {
  it("creates review-gated actions from tracked keyword evidence", async () => {
    const result = await prepareSeoReview(new DemoAIProvider(), context, [{ keyword: "villa renovation dubai", target_url: "/villa-renovation", current_position: 14, previous_position: 19, priority: "high", notes: null }]);
    expect(result.tasks).toHaveLength(1);
    expect(result.tasks[0]).toMatchObject({ target_url: "/villa-renovation", impact: "high", status: "awaiting_review" });
    expect(result.tasks[0].notes).toContain("position 14");
  });
  it("requires tracked evidence", async () => {
    await expect(prepareSeoReview(new DemoAIProvider(), context, [])).rejects.toThrow("No tracked keywords");
  });
});
