import type { ClientResultsData, ClientResultPart } from "./client-results";

/** Explicit local-only fault injection. Never applies to live data or deployed builds. */
export async function applyLocalResultsScenario(
  data: ClientResultsData,
  part: ClientResultPart,
  env: Record<string, string | undefined> = process.env,
): Promise<ClientResultsData> {
  if (!data.isDemo || env.NODE_ENV !== "development" || env.VERCEL_ENV)
    return data;
  const scenario = env.GROWTH_QA_SCENARIO;
  if (part === "metrics" && scenario === "slow-analytics") {
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  if (part === "metrics" && scenario === "failed-analytics") {
    return { ...data, unavailableSources: ["analytics"] };
  }
  if (scenario === "single-point") {
    return {
      ...data,
      traffic: {
        ...data.traffic,
        trend: [{ label: "Sep 8", value: data.traffic.visitors }],
      },
      search: { ...data.search, trend: [] },
      leads: { ...data.leads, trend: [] },
    };
  }
  return data;
}
