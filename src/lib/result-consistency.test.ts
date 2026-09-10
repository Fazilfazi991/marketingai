import { describe, expect, it } from "vitest";
import {
  dailySeries,
  keywordCounts,
  keywordMovement,
  pageIdentity,
  pageLabel,
  resultHref,
} from "./result-consistency";

describe("selected-period consistency", () => {
  const rows = [
    { day: "2026-07-10", value: 50 },
    { day: "2026-09-01", value: 20 },
    { day: "2026-09-25", value: 3 },
    { day: "2026-09-30", value: 4 },
    { day: "2026-10-01", value: 100 },
  ];
  it("uses inclusive bounds and never fills missing daily history", () => {
    expect(dailySeries(rows, "2026-09-24", "2026-09-30")).toEqual([
      { label: "2026-09-25", value: 3 },
      { label: "2026-09-30", value: 4 },
    ]);
    expect(dailySeries(rows, "2026-09-26", "2026-09-29")).toEqual([]);
  });
  it("90D → 7D → 30D → 7D is deterministic with no stale series", () => {
    const ranges = ["2026-07-03", "2026-09-24", "2026-09-01", "2026-09-24"];
    const results = ranges.map((start) =>
      dailySeries(rows, start, "2026-09-30"),
    );
    expect(results[1]).toEqual(results[3]);
    expect(
      results.map((points) =>
        points.reduce((sum, point) => sum + point.value, 0),
      ),
    ).toEqual([77, 7, 27, 7]);
  });
  it("preserves resolved dates and encodes source drill-down", () => {
    expect(
      resultHref(
        "/client/leads",
        { rangeKey: "7d", rangeStart: "2026-09-24", rangeEnd: "2026-09-30" },
        { source: "website_form" },
      ),
    ).toBe(
      "/client/leads?range=custom&from=2026-09-24&to=2026-09-30&source=website_form",
    );
  });
});
describe("summary identity and counts", () => {
  it("derives all counts from the same rows without null-as-zero movement", () => {
    const rows = [
      { keyword: "A", previous: 14, current: 8 },
      { keyword: "B", previous: 10, current: 12 },
      { keyword: "C", previous: 5, current: 5 },
      { keyword: "D", previous: 0, current: 9, comparable: false },
    ];
    expect(keywordCounts(rows)).toEqual({
      total: 4,
      improved: 1,
      declined: 1,
      stable: 1,
    });
    expect(keywordMovement(rows[3])).toBe("Unavailable");
  });
  it("uses verified title, pathname, and safe nonblank fallback", () => {
    expect(
      pageLabel("https://example.com/kitchen-renovation", " Kitchen "),
    ).toBe("Kitchen");
    expect(pageLabel("https://example.com/kitchen%20renovation", " ")).toBe(
      "/kitchen renovation",
    );
    expect(pageLabel("/")).toBe("Home");
    expect(pageLabel("")).toBe("Page not identified");
    expect(pageLabel("Kitchen Renovation")).toBe("Kitchen Renovation");
    expect(pageIdentity("https://example.com/service/?ad=1")).toBe("/service");
    expect(pageIdentity("/service-other")).not.toBe(pageIdentity("/service"));
  });
});
