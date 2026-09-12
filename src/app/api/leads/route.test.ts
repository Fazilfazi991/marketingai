import { createHash } from "node:crypto";
import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  inserted: vi.fn(),
  siteIdentifier: "qa-site",
  site: {
    id: "site-1",
    client_id: "10000000-0000-4000-8000-000000000001",
    origin: "https://approved.example",
    secret_hash: "",
    status: "active",
  },
}));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from(table: string) {
      if (table === "leads") {
        return {
          insert(row: Record<string, unknown>) {
            mocks.inserted(row);
            return {
              select: () => ({
                single: async () => ({ data: { id: "lead-1" }, error: null }),
              }),
            };
          },
        };
      }

      let identifier = "";
      const result = () => ({
        data:
          identifier && identifier !== mocks.siteIdentifier
            ? null
            : identifier
              ? mocks.site
              : [{ origin: mocks.site.origin }],
        error: null,
      });
      const query = {
        select: () => query,
        eq(field: string, value: string) {
          if (field === "site_identifier") identifier = value;
          return query;
        },
        maybeSingle: async () => result(),
        update: () => ({ eq: async () => ({ error: null }) }),
        then(resolve: (value: ReturnType<typeof result>) => unknown) {
          return Promise.resolve(result()).then(resolve);
        },
      };
      return query;
    },
  }),
}));

import { OPTIONS, POST } from "./route";

const body = {
  client_id: "20000000-0000-4000-8000-000000000002",
  event_id: "form-1",
  source: "website_form",
  email: "lead@example.com",
};

function request(
  method: "POST" | "OPTIONS",
  origin: string | null,
  site = mocks.siteIdentifier,
) {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  if (method === "POST") {
    headers.set("content-type", "application/json");
    headers.set("x-growth1000-site", site);
    headers.set("x-growth1000-site-key", "correct-key");
  }
  return new NextRequest("https://gro.example/api/leads", {
    method,
    headers,
    ...(method === "POST" ? { body: JSON.stringify(body) } : {}),
  });
}

describe("lead ingestion CORS and tenant isolation", () => {
  beforeEach(() => {
    mocks.inserted.mockClear();
    mocks.site.secret_hash = createHash("sha256")
      .update("correct-key")
      .digest("hex");
  });

  it("allows preflight only for an explicitly configured origin", async () => {
    const approved = await OPTIONS(
      request("OPTIONS", "https://approved.example"),
    );
    expect(approved.status).toBe(204);
    expect(approved.headers.get("access-control-allow-origin")).toBe(
      "https://approved.example",
    );

    const rejected = await OPTIONS(
      request("OPTIONS", "https://wrong.example"),
    );
    expect(rejected.status).toBe(403);
    expect(rejected.headers.has("access-control-allow-origin")).toBe(false);
  });

  it("rejects the wrong browser origin", async () => {
    const response = await POST(request("POST", "https://wrong.example"));
    expect(response.status).toBe(403);
    expect(mocks.inserted).not.toHaveBeenCalled();
  });

  it("preserves server-to-server requests without emitting browser CORS", async () => {
    const response = await POST(request("POST", null));
    expect(response.status).toBe(201);
    expect(response.headers.has("access-control-allow-origin")).toBe(false);
  });

  it("rejects forged sites and binds accepted leads to the verified client", async () => {
    const forged = await POST(
      request("POST", "https://approved.example", "forged-site"),
    );
    expect(forged.status).toBe(401);
    expect(mocks.inserted).not.toHaveBeenCalled();

    const accepted = await POST(
      request("POST", "https://approved.example"),
    );
    expect(accepted.status).toBe(201);
    expect(accepted.headers.get("access-control-allow-origin")).toBe(
      "https://approved.example",
    );
    expect(mocks.inserted).toHaveBeenCalledWith(
      expect.objectContaining({ client_id: mocks.site.client_id }),
    );
    expect(mocks.inserted).not.toHaveBeenCalledWith(
      expect.objectContaining({ client_id: body.client_id }),
    );
  });
});
