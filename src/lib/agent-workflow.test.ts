import { describe, expect, it } from "vitest";
import {
  agentPrompts,
  requestCategories,
  requestStatuses,
  statusLabel,
  uuidPattern,
  validMessage,
} from "./agent-workflow";
describe("Growth Agent workflow contract", () => {
  it("rejects empty or oversized messages", () => {
    expect(validMessage("   ")).toBe(false);
    expect(validMessage(null)).toBe(false);
    expect(validMessage({ body: "hello" })).toBe(false);
    expect(validMessage("x".repeat(4001))).toBe(false);
    expect(validMessage("x".repeat(4000))).toBe(true);
    expect(validMessage(" How is my website doing? ")).toBe(true);
  });
  it("validates identifiers without accepting paths or SQL", () => {
    expect(uuidPattern.test("a0000000-0000-0000-0000-000000000001")).toBe(true);
    expect(uuidPattern.test("../another-client")).toBe(false);
    expect(uuidPattern.test("'; delete from messages")).toBe(false);
  });
  it("exposes only the agreed managed-service categories", () => {
    expect(Object.keys(requestCategories)).toEqual([
      "website",
      "seo",
      "google_search",
      "whatsapp",
      "chatbot",
      "analytics",
      "general",
    ]);
    expect(Object.values(requestStatuses)).toContain("Needs Your Approval");
    expect(statusLabel("in_progress")).toBe("In Progress");
  });
  it("supplies shortcuts, not fabricated conversation messages", () => {
    expect(agentPrompts).toHaveLength(8);
    expect(agentPrompts).toContain("I need a change on my website.");
  });
});
