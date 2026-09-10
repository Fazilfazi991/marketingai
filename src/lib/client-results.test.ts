import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({
  calls: [] as string[],
  fail: "",
  user: "qa-user",
  client: "qa-client",
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/demo-mode", () => ({ isDemoMode: () => false }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: state.user ? { id: state.user } : null },
      }),
    },
    from: (name: string) => query(name),
    rpc: (name: string) => query(name),
  }),
}));

function query(name: string) {
  state.calls.push(name);
  const result = () => ({
    data:
      name === "client_members"
        ? { client_id: state.client, clients: { name: "QA workspace" } }
        : [],
    error: state.fail === name ? { message: "private upstream error" } : null,
  });
  const chain = {
    select: () => chain,
    eq: () => chain,
    gte: () => chain,
    lt: () => chain,
    order: () => chain,
    limit: () => chain,
    in: () => chain,
    maybeSingle: () => Promise.resolve(result()),
    then: (resolve: (value: ReturnType<typeof result>) => unknown) =>
      Promise.resolve(result()).then(resolve),
  };
  return chain;
}

import { loadClientResults } from "./client-results";
beforeEach(() => {
  state.calls = [];
  state.fail = "";
  state.user = "qa-user";
  state.client = "qa-client";
});
describe("client query partitioning and failure safety", () => {
  it("loads only the lead source for the leads route", async () => {
    const data = await loadClientResults({}, "leads");
    expect(state.calls).toEqual(["client_members", "leads"]);
    expect(data.scope).toBe("qa-user:qa-client");
  });
  it("loads only published reports for the reports route", async () => {
    await loadClientResults({}, "reports");
    expect(state.calls).toEqual(["client_members", "reports"]);
  });
  it("does not wait for analytics or pages to build primary results", async () => {
    await loadClientResults({}, "primary");
    expect(state.calls).toEqual([
      "client_members",
      "leads",
      "client_keyword_results",
      "reports",
    ]);
  });
  it("includes actual organic clicks in the lower summary source set", async () => {
    await loadClientResults({}, "insights");
    expect(state.calls).toContain("search_console_daily");
    expect(state.calls).not.toContain("analytics_daily");
  });
  it("marks a failed source rather than presenting it as a verified empty result", async () => {
    state.fail = "analytics_daily";
    const data = await loadClientResults({}, "metrics");
    expect(data.unavailableSources).toEqual(["analytics"]);
    expect(JSON.stringify(data)).not.toContain("private upstream error");
    expect(data.loadedSources).toContain("leads");
  });
  it("fails closed before querying client data without authentication", async () => {
    state.user = "";
    await expect(loadClientResults()).rejects.toThrow("Sign in");
    expect(state.calls).toEqual([]);
  });
  it("fails closed when the membership lookup fails", async () => {
    state.fail = "client_members";
    await expect(loadClientResults()).rejects.toThrow("No client workspace");
    expect(state.calls).toEqual(["client_members"]);
  });
});
