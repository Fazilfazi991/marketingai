import "server-only";
import { createHash } from "node:crypto";
import type { GrowthAgentContext } from "./contracts";
import { slots, type ModelConfiguration, type ModelSlot } from "./model-config";
import { runRoutedAnalysis, type RoutedAnalysisResult } from "./routed-analysis";
import type { RoutedAgentProvider } from "./providers";
import { buildGrowthPrompt } from "./prompt";

export type BenchmarkCase = { id: string; context: GrowthAgentContext };
export type BenchmarkRow = {
  caseId: string; slot: ModelSlot; inputDigest: string;
  state: RoutedAnalysisResult["state"] | "not_run"; result?: RoutedAnalysisResult;
  checks?: { contractAndEvidenceChecksPassed: boolean; answerCharacters: number };
  humanReview: { factualFidelity: number | null; usefulness: number | null; conciseness: number | null; unsupportedClaims: number | null; instructionFollowing: number | null };
};
/** Internal only, no route/CLI auto-run. Approval AND configured credentials are
 * required. Never copies Production data or obtains its own fixtures/credentials.
 * Human semantic grading is explicitly separate from mechanical output checks.
 */
export async function benchmarkGrowthProviders(cases: BenchmarkCase[], config: ModelConfiguration, providers: Partial<Record<ModelSlot, RoutedAgentProvider>>, approved = false): Promise<BenchmarkRow[]> {
  if (cases.length > 10) throw new Error("Benchmark is limited to ten cases.");
  const output: BenchmarkRow[] = [];
  for (const test of cases) {
    const snapshot = structuredClone(test.context);
    const digest = createHash("sha256").update(JSON.stringify(buildGrowthPrompt({ question: snapshot.question, intent: snapshot.intent, business: snapshot.business, evidence: snapshot.evidence, conversation: snapshot.conversation, permittedActions: ["suggest_supervised_request"] }))).digest("hex");
    for (const slot of slots) {
      const row: BenchmarkRow = { caseId: test.id, slot, inputDigest: digest, state: "not_run", humanReview: { factualFidelity: null, usefulness: null, conciseness: null, unsupportedClaims: null, instructionFollowing: null } };
      if (approved && config.callsEnabled && config.models[slot].available && providers[slot]) {
        const isolated = structuredClone(config);
        isolated.policy.defaultSlot = slot; isolated.policy.complexSlot = slot;
        isolated.policy.fallbacks = { deepseekFlash: [], deepseekPro: [], glmFlash: [] };
        isolated.policy.maxAttempts = 1;
        row.result = await runRoutedAnalysis(snapshot, isolated, providers);
        row.state = row.result.state;
        row.checks = { contractAndEvidenceChecksPassed: row.result.state === "answered", answerCharacters: row.result.response?.answer.length ?? 0 };
      }
      output.push(row);
    }
  }
  return output;
}
