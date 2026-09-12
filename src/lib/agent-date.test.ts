import { describe, expect, it } from "vitest";
import { agentDate, agentTime } from "./agent-date";

describe("agent timestamp hydration", () => {
  it("uses the same Dubai date and time across server and browser host zones", () => {
    const original = process.env.TZ;
    try {
      for (const zone of ["UTC", "Asia/Dubai", "America/Los_Angeles"]) {
        process.env.TZ = zone;
        expect(agentDate("2026-09-11T22:05:00Z")).toBe("12/09/2026");
        expect(agentTime("2026-09-11T22:05:00Z")).toBe("12/09/2026, 02:05:00");
        expect(agentTime("2026-09-11T22:05:00Z", true)).toBe("12 Sept, 02:05");
      }
    } finally {
      if (original === undefined) delete process.env.TZ;
      else process.env.TZ = original;
    }
  });
});
