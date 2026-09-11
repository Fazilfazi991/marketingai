import { afterEach, describe, expect, it, vi } from "vitest";
import { measuredFetch } from "./performance";
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});
describe("private upstream request measurements", () => {
  it("never logs a private storage filename", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}")));
    await measuredFetch(
      "https://example.test/storage/v1/object/private/customer-private-file.pdf",
    );
    expect(JSON.stringify(log.mock.calls)).not.toContain(
      "customer-private-file",
    );
    expect(JSON.stringify(log.mock.calls)).toContain("supabase.request");
  });
  it("does not log query values or credentials and prevents shared fetch caching", async () => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const request = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", request);
    await measuredFetch(
      "https://example.test/rest/v1/leads?client_id=private-client",
      { headers: { Authorization: "Bearer private-token" } },
    );
    const options = request.mock.calls[0][1];
    expect(options.cache).toBe("no-store");
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.stringify(log.mock.calls)).toContain("db.leads");
    expect(JSON.stringify(log.mock.calls)).not.toContain("private-client");
    expect(JSON.stringify(log.mock.calls)).not.toContain("private-token");
  });
  it("preserves caller cancellation", async () => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    const controller = new AbortController();
    controller.abort();
    const request = vi.fn().mockResolvedValue(new Response("{}"));
    vi.stubGlobal("fetch", request);
    await measuredFetch("https://example.test/auth/v1/user", {
      signal: controller.signal,
    });
    expect(request.mock.calls[0][1].signal.aborted).toBe(true);
  });
});
