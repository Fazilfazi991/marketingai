import { beforeEach, describe, expect, it } from "vitest";
import { resetDashboardAssistantRateLimits, takeDashboardAssistantRequest } from "./dashboard-assistant-rate-limit";

describe("dashboard assistant rate limit", () => {
  beforeEach(() => resetDashboardAssistantRateLimits());
  it("limits each actor independently", () => {
    expect(takeDashboardAssistantRequest("client-a", 100, 1, 1000).allowed).toBe(true);
    expect(takeDashboardAssistantRequest("client-a", 101, 1, 1000).allowed).toBe(false);
    expect(takeDashboardAssistantRequest("client-b", 101, 1, 1000).allowed).toBe(true);
  });
  it("opens a new window after reset", () => {
    takeDashboardAssistantRequest("client-a", 100, 1, 1000);
    expect(takeDashboardAssistantRequest("client-a", 1100, 1, 1000).allowed).toBe(true);
  });
});
