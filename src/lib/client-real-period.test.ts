import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  user: "user-a" as string | null,
  client: "client-a" as string | null,
  calls: [] as Array<{ table: string; field: string; value: unknown }>,
}));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/demo-mode", () => ({ isDemoMode: () => false }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: {
      getUser: async () => ({
        data: { user: mock.user ? { id: mock.user } : null },
      }),
    },
    from: (table: string) => {
      const data: Record<string, Record<string, unknown>[]> = {
        leads: ["2026-09-01", "2026-09-25", "2026-09-30"].map((day, index) => ({
          id: index,
          client_id: "client-a",
          created_at: `${day}T12:00:00Z`,
          source: index === 2 ? "website_form" : "whatsapp",
          source_url: "https://example.com/service",
          lead_quality: "qualified",
        })),
        analytics_daily: ["2026-09-01", "2026-09-25", "2026-09-30"].map(
          (day, index) => ({
            day,
            client_id: "client-a",
            metrics: { users: (index + 1) * 10 },
          }),
        ),
        search_console_daily: ["2026-09-01", "2026-09-25", "2026-09-30"].map(
          (day, index) => ({
            day,
            client_id: "client-a",
            metrics: { clicks: index + 1, impressions: 100 },
          }),
        ),
      };
      let rows = data[table] ?? [];
      const query = {
        select: () => query,
        eq: (field: string, value: unknown) => {
          mock.calls.push({ table, field, value });
          rows = rows.filter((row) => row[field] === value);
          return query;
        },
        gte: (field: string, value: string) => {
          rows = rows.filter((row) => String(row[field]) >= value);
          return query;
        },
        lt: (field: string, value: string) => {
          rows = rows.filter((row) => String(row[field]) < value);
          return query;
        },
        in: () => query,
        order: () => query,
        limit: () => query,
        maybeSingle: async () => ({
          data: mock.client
            ? { client_id: mock.client, clients: { name: "Client A" } }
            : null,
          error: null,
        }),
        then: (resolve: (value: unknown) => unknown) =>
          Promise.resolve({ data: rows, error: null }).then(resolve),
      };
      return query;
    },
    rpc: async () => ({ data: [], error: null }),
  }),
}));
import { loadClientResults } from "./client-results";

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-30T12:00:00Z"));
  mock.user = "user-a";
  mock.client = "client-a";
  mock.calls = [];
});
afterEach(() => vi.useRealTimers());
describe("real-data period and tenant regression", () => {
  it.each(["today", "7d", "30d", "90d", "month", "last-month", "year"])(
    "%s reconciles totals, daily points and dates",
    async (range) => {
      const data = await loadClientResults({ range });
      for (const [total, points] of [
        [data.traffic.visitors, data.traffic.trend!],
        [data.search.clicks, data.search.trend!],
        [data.leads.total, data.leads.trend],
      ] as const) {
        expect(points.reduce((sum, point) => sum + point.value, 0)).toBe(total);
        expect(
          points.every(
            (point) =>
              point.label >= data.rangeStart && point.label <= data.rangeEnd,
          ),
        ).toBe(true);
      }
    },
  );
  it("KPI and plotted points use identical selected-period rows", async () => {
    const data = await loadClientResults({
      range: "custom",
      from: "2026-09-01",
      to: "2026-09-10",
    });
    for (const [total, points] of [
      [data.traffic.visitors, data.traffic.trend!],
      [data.search.clicks, data.search.trend!],
      [data.leads.total, data.leads.trend],
    ] as const) {
      expect(points.length).toBe(1);
      expect(points.reduce((sum, point) => sum + point.value, 0)).toBe(total);
      expect(
        points.every(
          (point) =>
            point.label >= data.rangeStart && point.label <= data.rangeEnd,
        ),
      ).toBe(true);
    }
  });
  it("source filters reconcile with the unfiltered current-period count", async () => {
    const all = await loadClientResults({
      range: "custom",
      from: "2026-09-01",
      to: "2026-09-10",
    });
    const source = await loadClientResults({
      range: "custom",
      from: "2026-09-01",
      to: "2026-09-10",
      source: "whatsapp",
    });
    expect(source.leads.total).toBe(
      all.leads.sources.find((item) => item.key === "whatsapp")?.value,
    );
  });
  it("binds every table read to the authenticated membership client", async () => {
    await loadClientResults();
    for (const table of [
      "leads",
      "analytics_daily",
      "search_console_daily",
      "reports",
      "content_items",
      "tasks",
      "analytics_page_daily",
    ])
      expect(mock.calls).toContainEqual({
        table,
        field: "client_id",
        value: "client-a",
      });
    expect(mock.calls).toContainEqual({
      table: "client_members",
      field: "user_id",
      value: "user-a",
    });
  });
  it("fails closed without a user or membership", async () => {
    mock.user = null;
    await expect(loadClientResults()).rejects.toThrow("Sign in");
    mock.user = "user-a";
    mock.client = null;
    await expect(loadClientResults()).rejects.toThrow("No client workspace");
  });
  it("reads only lead data for the leads route", async () => {
    const data = await loadClientResults({}, "leads");
    expect(data.loadedSources).toEqual(["leads"]);
    expect([...new Set(mock.calls.map((call) => call.table))].sort()).toEqual([
      "client_members",
      "leads",
    ]);
  });
  it("reads only published reports for the reports route", async () => {
    const data = await loadClientResults({}, "reports");
    expect(data.loadedSources).toEqual(["reports"]);
    expect([...new Set(mock.calls.map((call) => call.table))].sort()).toEqual([
      "client_members",
      "reports",
    ]);
  });
  it("does not reuse another client's table data", async () => {
    mock.client = "client-b";
    const data = await loadClientResults();
    expect(data.leads.total).toBe(0);
    expect(data.traffic.visitors).toBe(0);
  });
});
