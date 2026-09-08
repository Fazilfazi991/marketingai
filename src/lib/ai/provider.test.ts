import { afterEach, describe, expect, it, vi } from "vitest";
import { OpenAICompatibleProvider } from "./provider";

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
