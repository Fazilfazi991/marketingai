import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ session: vi.fn(), admin: vi.fn(), demo: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.session }));
vi.mock("@/lib/supabase/admin", () => ({ createAdminClient: mocks.admin }));
vi.mock("@/lib/demo-mode", () => ({ isDemoMode: mocks.demo }));
import { buildGrowthAgentContext } from "./context";

type Call = { table: string; fields: string; filters: [string, unknown][]; limit: number };
const clientId = "30000000-0000-0000-0000-000000000001";
const conversationId = "50000000-0000-0000-0000-000000000001";
let user: { id: string } | null;
let memberships: { client_id: string }[];
let calls: Call[];
let topicAllowed: boolean;
let sourceError: string | null;
let demoClient: boolean;

function database(privileged: boolean) {
  return {
    auth: { getUser: async () => ({ data: { user }, error: null }) },
    from(table: string) {
      const call: Call = { table, fields: "", filters: [], limit: 0 };
      if (privileged) calls.push(call);
      const result = () => {
        if (!privileged) {
          if (table === "client_members") return { data: memberships, error: null };
          if (table === "clients") return { data: { id: clientId, organization_id: "org-a", name: "Client A", lifecycle_status: "active", is_demo: demoClient }, error: null };
          if (table === "agent_conversations") return { data: topicAllowed ? { id: conversationId } : null, error: topicAllowed ? null : { code: "42501" } };
          if (table === "agent_messages") return { data: [{ sender_type: "client", body: "a".repeat(900) }], error: null };
        }
        if (sourceError === table) return { data: null, error: { code: "unavailable" } };
        if (!call.filters.some(([key, value]) => key === "client_id" && value === clientId)) throw new Error("Unscoped privileged read");
        if (table === "business_profiles") return { data: [{ description: "Client A only", prohibited_claims: "No guaranteed results" }], error: null };
        if (table === "business_services") return { data: [{ name: "Renovation" }], error: null };
        return { data: [], error: null };
      };
      const query = {
        select(fields: string) { call.fields = fields; return query; },
        eq(key: string, value: unknown) { call.filters.push([key, value]); return query; },
        in() { return query; }, order() { return query; }, gte() { return query; }, lte() { return query; },
        limit(n: number) { call.limit = n; return query; },
        single: async () => result(),
        then(resolve: (value: unknown) => void) { return Promise.resolve(result()).then(resolve); },
      };
      return query;
    },
  };
}

describe("Server context tenant boundary", () => {
  beforeEach(() => {
    vi.clearAllMocks(); user = { id: "user-a" }; memberships = [{ client_id: clientId }]; calls = []; topicAllowed = true; sourceError = null; demoClient = false;
    mocks.demo.mockReturnValue(false); mocks.session.mockResolvedValue(database(false)); mocks.admin.mockReturnValue(database(true));
  });
  it("rejects anonymous access before privileged reads", async () => {
    user = null;
    await expect(buildGrowthAgentContext("How is traffic?")).rejects.toThrow("Authentication");
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it.each([{ values: [] }, { values: [{ client_id: clientId }, { client_id: "client-b" }] }])("rejects missing or ambiguous memberships", async ({ values }) => {
    memberships = values;
    await expect(buildGrowthAgentContext("How is traffic?")).rejects.toThrow("membership");
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("rejects another client's conversation before loading business data", async () => {
    topicAllowed = false;
    await expect(buildGrowthAgentContext("How is traffic?", conversationId)).rejects.toThrow("Conversation access");
    expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("uses only server-derived ownership on every privileged query", async () => {
    const c = await buildGrowthAgentContext("What should I improve?", conversationId, new Date("2026-09-12T10:00:00Z"));
    expect(c.scope.clientId).toBe(clientId); expect(c.scope.organizationId).toBe("org-a");
    expect(c.business.description).toBe("Client A only");
    expect(c.business.prohibitedClaims).toBe("No guaranteed results");
    expect(calls.length).toBeGreaterThan(5);
    expect(calls.every(call => call.filters.some(([key, value]) => key === "client_id" && value === clientId))).toBe(true);
    expect(c.conversation[0].text.length).toBe(600);
  });
  it("does not select secrets, leads, internal notes or full crawl content", async () => {
    await buildGrowthAgentContext("What should I improve?");
    for (const call of calls) {
      expect(call.fields).not.toBe("*");
      expect(call.fields).not.toMatch(/internal_notes|content_excerpt|email|phone|secret|token|created_by/);
      expect(call.table).not.toMatch(/leads|agent_internal_notes|client_integrations/);
      expect(call.limit).toBeGreaterThan(0);
    }
  });
  it("filters published history, non-demo snapshots and verified FAQs", async () => {
    await buildGrowthAgentContext("What should I improve?");
    expect(calls.find(c => c.table === "reports")?.filters).toContainEqual(["status", "published"]);
    expect(calls.find(c => c.table === "analytics_daily")?.filters).toContainEqual(["is_demo", false]);
    expect(calls.find(c => c.table === "business_faqs")?.filters).toContainEqual(["verified", true]);
  });
  it("does not represent source errors as measured zeros", async () => {
    sourceError = "analytics_daily";
    const c = await buildGrowthAgentContext("Why did traffic fall?");
    expect(c.evidence.sources.analytics?.state).toBe("unavailable");
    expect(c.evidence.facts.filter(f => f.source === "analytics")).toEqual([]);
  });
  it("does not load irrelevant source tables", async () => {
    await buildGrowthAgentContext("How is Google doing?");
    expect(calls.some(c => c.table === "analytics_daily")).toBe(false);
    expect(calls.some(c => c.table === "search_console_daily")).toBe(true);
  });
  it("does not retrieve operational context for a request", async () => {
    const c = await buildGrowthAgentContext("Please fix this page.");
    expect(c.intent).toBe("request"); expect(mocks.admin).not.toHaveBeenCalled();
  });
  it("rejects demo mode without inventing business evidence", async () => {
    mocks.demo.mockReturnValue(true);
    await expect(buildGrowthAgentContext("How is traffic?")).rejects.toThrow("real workspace");
    expect(mocks.session).not.toHaveBeenCalled();
  });
  it("rejects demo client data even when application demo mode is off", async () => {
    demoClient = true;
    await expect(buildGrowthAgentContext("How is traffic?")).rejects.toThrow("non-demo");
    expect(mocks.admin).not.toHaveBeenCalled();
  });
});
