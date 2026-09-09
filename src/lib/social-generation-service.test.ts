import { describe, expect, it } from "vitest";
import { normalizeSuggestedTime } from "./social-generation-service";

describe("normalizeSuggestedTime", () => {
  it.each([
    ["10:00 AM", "10:00"],
    ["2:30 PM", "14:30"],
    ["14:15", "14:15"],
    ["9 PM", "21:00"],
    ["not a time", "11:00"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizeSuggestedTime(input)).toBe(expected);
  });
});
