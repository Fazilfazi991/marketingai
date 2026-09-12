import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  create: vi.fn(),
  demo: vi.fn(),
  load: vi.fn(),
  rpc: vi.fn(),
  user: vi.fn(),
}));
vi.mock("@/lib/supabase/server", () => ({ createClient: mocks.create }));
vi.mock("@/lib/demo-mode", () => ({ isDemoMode: mocks.demo }));
vi.mock("@/lib/agent-data", () => ({ loadAgentWorkspace: mocks.load }));
import { GET, POST } from "../app/api/agent/workflow/route";
const key = "a0000000-0000-0000-0000-000000000001";
const post = (data: unknown, origin = "http://localhost:3000") =>
  POST(
    new Request("http://localhost:3000/api/agent/workflow", {
      method: "POST",
      headers: { origin },
      body: JSON.stringify(data),
    }),
  );
describe("Agent API boundaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.demo.mockReturnValue(false);
    mocks.user.mockResolvedValue({ data: { user: { id: key } } });
    mocks.create.mockResolvedValue({
      auth: { getUser: mocks.user },
      rpc: mocks.rpc,
    });
    mocks.rpc.mockResolvedValue({ data: key, error: null });
  });
  it("saves through one transaction without accepting caller tenant or sender", async () => {
    expect((await post({ body: "Hello", key })).status).toBe(200);
    expect(mocks.rpc).toHaveBeenCalledWith("agent_send", {
      p_body: "Hello",
      p_key: key,
      p_conversation: null,
    });
    expect(
      (await post({ body: "Hello", key, sender_type: "staff", client_id: key }))
        .status,
    ).toBe(400);
    expect(mocks.rpc).toHaveBeenCalledTimes(1);
  });
  it("rejects cross-origin sends", async () => {
    expect(
      (await post({ body: "Hello", key }, "https://attacker.invalid")).status,
    ).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("does not mutate demo data", async () => {
    mocks.demo.mockReturnValue(true);
    expect((await post({ body: "Hello", key })).status).toBe(403);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("requires verified authentication", async () => {
    mocks.user.mockResolvedValue({ data: { user: null } });
    expect((await post({ body: "Hello", key })).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("does not disguise database access rejection", async () => {
    mocks.rpc.mockResolvedValue({ error: { code: "42501" } });
    expect(
      (
        await post({
          action: "status",
          value: "completed",
          conversation: key,
          key,
        })
      ).status,
    ).toBe(403);
  });
  it("acknowledges a saved transaction independently of refresh", async () => {
    mocks.load.mockRejectedValue(new Error());
    expect(await (await post({ body: "Hello", key })).json()).toEqual({
      saved: true,
      conversation: key,
    });
    expect(mocks.load).not.toHaveBeenCalled();
  });
  it("rejects malformed identifiers and invalid team actions", async () => {
    expect((await post({ body: "Hello", key: "invalid" })).status).toBe(400);
    expect(
      (
        await post({
          action: "execute_website_change",
          value: "",
          conversation: key,
          key,
        })
      ).status,
    ).toBe(400);
  });
  it("reloads via an authenticated RLS scoped loader with no cache", async () => {
    mocks.load.mockResolvedValue({ topics: [] });
    const response = await GET(
      new Request("http://localhost:3000/api/agent/workflow?staff=true"),
    );
    expect(mocks.load).toHaveBeenCalledWith(true);
    expect(response.headers.get("cache-control")).toBe("private, no-store");
  });
});
