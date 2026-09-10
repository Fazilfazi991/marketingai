import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
vi.mock("@/lib/demo-mode", () => ({ isDemoMode: () => true }));
vi.mock("@/lib/supabase/server", () => ({ createClient: vi.fn() }));
import { loadClientResults } from "./client-results";
import { keywordCounts } from "./result-consistency";

describe("dashboard demo regression", () => {
  it.each(["today", "7d", "month", "last-month", "30d", "90d", "year"])("%s drill-down retains identical aggregates using resolved dates", async range => {
    const summary = await loadClientResults({ range });
    const detail = await loadClientResults({ range: "custom", from: summary.rangeStart, to: summary.rangeEnd });
    expect(detail.leads).toEqual(summary.leads);
    expect(detail.traffic).toEqual(summary.traffic);
    expect(detail.search).toEqual(summary.search);
    expect(detail.topPages).toEqual(summary.topPages);
  });
  it.each([
    "today",
    "7d",
    "month",
    "last-month",
    "30d",
    "90d",
    "year",
    "custom",
  ])(
    "%s never reuses monthly charts under selected-period KPIs",
    async (range) => {
      const data = await loadClientResults({
        range,
        from: "2026-09-10",
        to: "2026-09-20",
      });
      expect(data.traffic.trend).toEqual([]);
      expect(data.search.trend).toEqual([]);
      expect(data.leads.trend).toEqual([]);
      expect(data.leads.total).toBe(
        data.leads.sources.reduce((sum, source) => sum + source.value, 0),
      );
      expect(data.search.improved).toBe(
        keywordCounts(data.search.keywords).improved,
      );
      expect(data.leads.growth).toBeNull();
      expect(data.traffic.growth).toBeNull();
    },
  );
  it("returns identical 7D data after repeated range changes", async () => {
    const values = [];
    for (const range of ["90d", "7d", "30d", "7d"])
      values.push(await loadClientResults({ range }));
    expect(values[1]).toEqual(values[3]);
  });
  it("reconciles source drill-down with hero counts", async () => {
    const data = await loadClientResults({ range: "7d" });
    for (const source of data.leads.sources) {
      const filtered = await loadClientResults({
        range: "custom",
        from: data.rangeStart,
        to: data.rangeEnd,
        source: source.key,
      });
      expect(filtered.leads.total).toBe(source.value);
      expect(
        filtered.leads.latest.every((item) => item.source === source.label),
      ).toBe(true);
    }
  });
});
