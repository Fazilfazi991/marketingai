import { describe, expect, it } from "vitest";
import { leadingSource, percentChange, qualifiedLeadCount, sumMetric } from "./report-metrics";

describe("report metrics", () => {
  it("aggregates the first available metric alias per row", () => {
    expect(sumMetric([{ metrics: { users: 3 } }, { metrics: { visitors: 4 } }], "users", "visitors")).toBe(7);
  });
  it("calculates period changes including a new baseline", () => {
    expect(percentChange(12, 10)).toBe(20);
    expect(percentChange(3, 0)).toBeNull();
    expect(percentChange(0, 0)).toBeNull();
    expect(percentChange(null, 10)).toBeNull();
  });
  it("distinguishes missing observations from measured zero", () => {
    expect(sumMetric([], "users")).toBeNull();
    expect(sumMetric([{ metrics: { users: null } }], "users")).toBeNull();
    expect(sumMetric([{ metrics: { users: 0, visitors: 9 } }], "users", "visitors")).toBe(0);
    expect(sumMetric([{ metrics: { users: 2 } }, { metrics: {} }], "users")).toBeNull();
  });
  it("counts qualified leads once and finds the strongest source", () => {
    const leads = [{ source: "whatsapp", lead_quality: "qualified", status: "qualified" }, { source: "whatsapp", lead_quality: "unqualified", status: "new" }, { source: "website_form", lead_quality: "high_intent", status: "new" }];
    expect(qualifiedLeadCount(leads)).toBe(2);
    expect(leadingSource(leads)).toEqual({ source: "whatsapp", count: 2 });
  });
});
