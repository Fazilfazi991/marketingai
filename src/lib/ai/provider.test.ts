import { afterEach, describe, expect, it, vi } from "vitest";
import { createAIProvider, OpenAICompatibleProvider } from "./provider";
import { DemoAIProvider } from "./demo-provider";

afterEach(() => vi.restoreAllMocks());

describe("OpenAI-compatible provider", () => {
  it("uses Vercel OIDC and AI Gateway when a direct provider key is unavailable", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ data: [] }) } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const provider = createAIProvider({ VERCEL_OIDC_TOKEN: "preview-oidc-token", AI_GATEWAY_MODEL: "google/gemini-2.5-flash" });
    await provider.generateSocialPlan({ clientId: "client", businessKnowledge: "Verified", services: [], offers: [], prohibitedClaims: [] }, "2026-09", 0);

    expect(fetchMock).toHaveBeenCalledWith("https://ai-gateway.vercel.sh/v1/chat/completions", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer preview-oidc-token" }),
    }));
    expect(JSON.parse(String(fetchMock.mock.calls[0][1]?.body))).toMatchObject({ model: "google/gemini-2.5-flash" });
  });

  it("keeps explicitly configured direct providers ahead of OIDC", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify({ data: [] }) } }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const provider = createAIProvider({ AI_API_KEY: "direct-key", AI_BASE_URL: "https://direct.example/v1", AI_MODEL: "direct-model", VERCEL_OIDC_TOKEN: "oidc-token" });
    await provider.generateSocialPlan({ clientId: "client", businessKnowledge: "Verified", services: [], offers: [], prohibitedClaims: [] }, "2026-09", 0);

    expect(fetchMock).toHaveBeenCalledWith("https://direct.example/v1/chat/completions", expect.objectContaining({
      headers: expect.objectContaining({ Authorization: "Bearer direct-key" }),
    }));
  });

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
