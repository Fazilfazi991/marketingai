import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAICompatibleProvider } from "./provider";
import { DemoAIProvider } from "./demo-provider";

afterEach(() => vi.restoreAllMocks());

describe("OpenAI-compatible provider", () => {
  it("unwraps JSON-object mode results", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ data: [{ topic: "One", concept: "Concept", caption: "Caption", hashtags: "#one", creativeBrief: "Brief" }] }) } }] }), { status: 200 })));
    const provider = new OpenAICompatibleProvider({ baseUrl: "https://example.test/v1", apiKey: "test-key", model: "test-model" });
    const result = await provider.generateSocialPlan({ clientId: "client", businessKnowledge: "Verified", services: [], offers: [], prohibitedClaims: [] }, "2026-09", 1);
    expect(result.data).toHaveLength(1);
    expect(result.data[0].topic).toBe("One");
  });

  it("rejects responses without the required data envelope", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ items: [] }) } }] }), { status: 200 })));
    const provider = new OpenAICompatibleProvider({ baseUrl: "https://example.test/v1", apiKey: "test-key", model: "test-model" });
    await expect(provider.analyzeSEO({ clientId: "client", businessKnowledge: "Verified", services: [], offers: [], prohibitedClaims: [] }, "input")).rejects.toThrow("data field");
  });
});

describe("demo blog generation", () => {
  it("creates a reviewable draft from verified services without unsupported claims", async () => {
    const provider = new DemoAIProvider();
    const context = { clientId: "demo", businessKnowledge: "ABC Interiors is verified.", services: ["Villa Renovation", "Wardrobes"], offers: [], prohibitedClaims: ["Prices", "Guarantees"] };
    const brief = await provider.generateBlogBrief(context, "villa renovation dubai");
    const draft = await provider.generateBlogDraft(context, brief.data);
    expect(brief.data).toContain("villa renovation dubai");
    expect(brief.data).toContain("Avoid prices, guarantees");
    expect(draft.data).toContain("Villa Renovation");
    expect(draft.data.length).toBeGreaterThan(500);
  });
});
