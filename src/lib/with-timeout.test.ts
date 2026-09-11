import { afterEach, describe, expect, it, vi } from "vitest";
import { withTimeout } from "./with-timeout";
afterEach(() => vi.useRealTimers());
describe("optional feature loading deadline", () => {
  it("returns successful work and clears its timer", async () => {
    vi.useFakeTimers();
    await expect(withTimeout(Promise.resolve("loaded"), 15000)).resolves.toBe(
      "loaded",
    );
    expect(vi.getTimerCount()).toBe(0);
  });
  it("rejects a stalled import at the deadline instead of spinning forever", async () => {
    vi.useFakeTimers();
    const result = expect(
      withTimeout(new Promise<never>(() => {}), 15000),
    ).rejects.toThrow("could not load in time");
    await vi.advanceTimersByTimeAsync(15000);
    await result;
    expect(vi.getTimerCount()).toBe(0);
  });
});
