import { describe, expect, it } from "vitest";
import { leadComparison, leadSourceLabel } from "./client-presentation";

describe("lead comparison presentation", () => {
  it("explains extreme growth against a small known baseline in absolute terms", () => {
    const leads = { total: 47, previousTotal: 6, growth: 683 };
    expect(leadComparison(leads)).toBe("+41 leads vs previous period (6 → 47)");
    expect(leads.growth).toBe(683);
  });
  it("does not infer an exact baseline from a rounded percentage", () => {
    expect(leadComparison({ total: 47, growth: 683 })).toBe(
      "+683% vs previous period",
    );
  });
  it("keeps ordinary positive and negative comparisons intact", () => {
    expect(leadComparison({ total: 47, previousTotal: 40, growth: 18 })).toBe(
      "+18% vs previous period",
    );
    expect(leadComparison({ total: 20, previousTotal: 40, growth: -50 })).toBe(
      "-50% vs previous period",
    );
  });
  it("does not manufacture a comparison when the baseline is unavailable", () => {
    expect(leadComparison({ total: 47, previousTotal: 0, growth: null })).toBe(
      "No previous-period baseline",
    );
  });
  it("does not cap large changes against a substantial baseline", () => {
    expect(
      leadComparison({ total: 1000, previousTotal: 100, growth: 900 }),
    ).toBe("+900% vs previous period");
  });
  it("shortens source display names without changing source keys", () => {
    expect(leadSourceLabel("website_chatbot", "Website AI chatbot")).toBe(
      "Website AI",
    );
    expect(leadSourceLabel("website_form", "Website form")).toBe("Web form");
    expect(leadSourceLabel("referral", "Referral")).toBe("Referral");
  });
});
