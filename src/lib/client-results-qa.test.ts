import { afterEach, describe, expect, it, vi } from "vitest";
import { applyLocalResultsScenario } from "./client-results-qa";
import type { ClientResultsData } from "./client-results";
const demo = { isDemo: true, clientName: "QA fixture" } as ClientResultsData;
afterEach(() => vi.useRealTimers());
describe("local results fault injection", () => {
  it("cannot affect production, Preview, or real client data", async () => {
    for (const env of [
      { NODE_ENV: "production" },
      { NODE_ENV: "development", VERCEL_ENV: "preview" },
      { NODE_ENV: "development", VERCEL_ENV: "production" },
    ]) {
      expect(
        await applyLocalResultsScenario(demo, "metrics", {
          ...env,
          GROWTH_QA_SCENARIO: "failed-analytics",
        }),
      ).toBe(demo);
    }
    const live = { ...demo, isDemo: false };
    expect(
      await applyLocalResultsScenario(live, "metrics", {
        NODE_ENV: "development",
        GROWTH_QA_SCENARIO: "failed-analytics",
      }),
    ).toBe(live);
  });
  it("makes only metrics fail, preserving primary and insights", async () => {
    const env = {
      NODE_ENV: "development",
      GROWTH_QA_SCENARIO: "failed-analytics",
    };
    expect(
      (await applyLocalResultsScenario(demo, "metrics", env))
        .unavailableSources,
    ).toEqual(["analytics"]);
    expect(await applyLocalResultsScenario(demo, "primary", env)).toBe(demo);
    expect(await applyLocalResultsScenario(demo, "insights", env)).toBe(demo);
  });
  it("resolves primary while metrics are still delayed", async () => {
    vi.useFakeTimers();
    const env = {
      NODE_ENV: "development",
      GROWTH_QA_SCENARIO: "slow-analytics",
    };
    let metricsReady = false;
    const metrics = applyLocalResultsScenario(demo, "metrics", env).then(() => {
      metricsReady = true;
    });
    expect(await applyLocalResultsScenario(demo, "primary", env)).toBe(demo);
    expect(metricsReady).toBe(false);
    await vi.advanceTimersByTimeAsync(5000);
    await metrics;
    expect(metricsReady).toBe(true);
  });
});
