import { describe, expect, it, vi } from "vitest";
import { generateImage, imageProviderConfig } from "./image-provider";

const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

describe("image provider", () => {
  it("uses dedicated image settings and falls back to the AI key", () => {
    expect(imageProviderConfig({})).toBeNull();
    expect(
      imageProviderConfig({
        AI_API_KEY: "fallback",
        IMAGE_API_KEY: "image-key",
        IMAGE_MODEL: "image-model",
      }),
    ).toMatchObject({ apiKey: "image-key", model: "image-model" });
  });

  it("returns validated PNG bytes without exposing the key", async () => {
    let sent: RequestInit | undefined;
    const request = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) => {
        sent = init;
        return new Response(
          JSON.stringify({ data: [{ b64_json: png.toString("base64") }] }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      },
    );
    const result = await generateImage(
      "Editorial kitchen interior",
      { baseUrl: "https://provider.test/v1/", apiKey: "secret", model: "img" },
      request as typeof fetch,
    );
    expect(result.bytes).toEqual(Uint8Array.from(png));
    expect(request).toHaveBeenCalledWith(
      "https://provider.test/v1/images/generations",
      expect.objectContaining({ method: "POST" }),
    );
    expect(JSON.stringify(sent?.body)).not.toContain("secret");
  });

  it("rejects missing and non-PNG output", async () => {
    const request = vi.fn(
      async () =>
        new Response(JSON.stringify({ data: [{ b64_json: "aGVsbG8=" }] }), {
          status: 200,
        }),
    );
    await expect(
      generateImage(
        "brief",
        { baseUrl: "https://provider.test", apiKey: "key", model: "img" },
        request as typeof fetch,
      ),
    ).rejects.toThrow("unsupported file type");
  });
});
