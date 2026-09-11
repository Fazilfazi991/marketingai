import { describe, expect, it } from "vitest";
import { publishedHistory, todayMetrics } from "./today-dashboard";
import type { ClientReport, ClientResultsData } from "./client-results";

const report = (month: string, users: number, usersAvailable = true) =>
  ({
    month,
    monthLabel: month,
    users,
    clicks: 10,
    usersAvailable,
    clicksAvailable: true,
    work: [],
    summary: "",
    nextFocus: "",
    posts: 0,
  }) satisfies ClientReport;
describe("Today dashboard evidence", () => {
  it("sorts only available published months through the selected end month", () => {
    const points = publishedHistory(
      [
        report("2026-09-01", 90),
        report("2026-07-01", 70),
        report("2026-08-01", 0, false),
        report("2026-10-01", 100),
      ],
      "2026-09-30",
      "users",
    );
    expect(points).toEqual([
      { label: "2026-07-01", value: 70 },
      { label: "2026-09-01", value: 90 },
    ]);
  });
  it("preserves a measured zero but never invents a missing baseline", () => {
    expect(
      publishedHistory([report("2026-08-01", 0)], "2026-08-31", "users"),
    ).toEqual([{ label: "2026-08-01", value: 0 }]);
    expect(publishedHistory([], "2026-08-31", "clicks")).toEqual([]);
  });
  it("does not confuse missing measurements or enquiries with conversations", () => {
    const data = {
      isDemo: false,
      traffic: { trend: [] },
      search: { trend: [] },
      leads: {
        total: 10,
        qualified: 3,
        sources: [
          { key: "website_form", value: 4 },
          { key: "website_chatbot", value: 2 },
          { key: "whatsapp", value: 4 },
        ],
      },
    } as unknown as ClientResultsData;
    expect(todayMetrics(data)).toEqual({
      trafficAvailable: false,
      searchAvailable: false,
      qualificationRate: 30,
      websiteEnquiries: 6,
      conversationEnquiries: 6,
    });
  });
  it("shows an honest zero-enquiry state without division by zero", () => {
    const data = {
      isDemo: false,
      traffic: { trend: [{ label: "2026-08-01", value: 0 }] },
      search: { trend: [{ label: "2026-08-01", value: 0 }] },
      leads: { total: 0, qualified: 0, sources: [] },
    } as unknown as ClientResultsData;
    expect(todayMetrics(data)).toMatchObject({
      trafficAvailable: true,
      searchAvailable: true,
      qualificationRate: null,
    });
  });
});
