import "server-only";
import type { GrowthAgentContext, Fact, Recommendation } from "./contracts";
import { validateGroundedAnswer } from "./answer";
import { growthCapability, type Capability } from "./capability";
import { routingSignals, routeGrowthModel } from "./model-router";
import { type ModelConfiguration, type ModelSlot, type ProviderName } from "./model-config";
import { ProviderFailure, type RoutedAgentProvider, type TokenUsage } from "./providers";
import { buildGrowthPrompt, type GroundedInput } from "./prompt";

export type AttemptMetadata = {
  provider: ProviderName; model: string | null; routingReason: string;
  intent: string; evidenceDomains: string[]; latencyMs: number;
  outcome: "success" | "failure"; failureCode?: string; fallbackUsed: boolean;
  usage: TokenUsage;
};
export type NormalizedGrowthAnswer = {
  answer: string; whyItMatters: string; facts: Fact[]; recommendations: Recommendation[];
  evidence_refs: string[]; confidence: "limited" | "sufficient"; missing_data: string[];
  suggested_action: { type: "suggest_supervised_request"; recommendationId: string } | null;
  provider_metadata: AttemptMetadata;
};
export type RoutedAnalysisResult = {
  state: "answered" | "provider_required" | "provider_unavailable" | Capability["state"];
  message?: string; response?: NormalizedGrowthAnswer; attempts: AttemptMetadata[];
};
export async function runRoutedAnalysis(context: GrowthAgentContext, config: ModelConfiguration, providers: Partial<Record<ModelSlot, RoutedAgentProvider>>, log?: (entry: AttemptMetadata & { clientId: string; organizationId: string }) => void): Promise<RoutedAnalysisResult> {
  // Immutable snapshot: neither an adapter nor fallback can alter the evidence source.
  const snapshot = structuredClone(context), capability = growthCapability(snapshot);
  if (["unsupported", "insufficient_data", "request"].includes(capability.state) || snapshot.intent === "availability") return { state: capability.state, message: capability.reason, attempts: [] };
  if (!config.callsEnabled) return { state: "provider_required", message: "Provider calls are disabled. No analysis was sent.", attempts: [] };
  const input: GroundedInput = { question: snapshot.question, intent: snapshot.intent, business: snapshot.business, evidence: snapshot.evidence, conversation: snapshot.conversation.slice(-6), permittedActions: ["suggest_supervised_request"] };
  try { buildGrowthPrompt(input); } catch { return { state: "insufficient_data", message: "Context exceeds its safe budget.", attempts: [] }; }
  const failed: ModelSlot[] = [], attempts: AttemptMetadata[] = [];
  const available = Object.fromEntries(Object.entries(config.models).map(([slot, model]) => [slot, model.available && Boolean(providers[slot as ModelSlot])])) as Record<ModelSlot, boolean>;
  for (let attempt = 0; attempt < config.policy.maxAttempts; attempt++) {
    const route = routeGrowthModel(routingSignals(snapshot), available, config.policy, failed);
    if (!route) break;
    const selected = config.models[route.slot], controller = new AbortController(), started = Date.now();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const metadata: AttemptMetadata = { provider: selected.provider, model: selected.model, routingReason: route.reason, intent: snapshot.intent, evidenceDomains: [...new Set(snapshot.evidence.facts.map(f => f.source))], latencyMs: 0, outcome: "failure", fallbackUsed: route.fallback, usage: { input: null, output: null, estimatedCostUsd: null } };
    let response: NormalizedGrowthAnswer | undefined;
    let stop = false;
    try {
      const reply = await Promise.race([providers[route.slot]!.call(structuredClone(input), controller.signal), new Promise<never>((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new ProviderFailure("timeout")); }, config.policy.timeoutMs); })]);
      metadata.usage = reply.usage;
      const answer = validateGroundedAnswer(reply.output, snapshot);
      if (!answer) throw new ProviderFailure("malformed");
      metadata.outcome = "success";
      response = { answer: answer.answer, whyItMatters: answer.whyItMatters,
        facts: snapshot.evidence.facts.filter(f => answer.evidenceIds.includes(f.id)),
        recommendations: snapshot.evidence.recommendations.filter(r => r.id === answer.recommendationId),
        evidence_refs: answer.evidenceIds, confidence: capability.state === "limited" ? "limited" : answer.dataQuality,
        missing_data: [...snapshot.evidence.limitations, ...Object.entries(snapshot.evidence.sources).filter(([, s]) => s.state !== "available").map(([name, s]) => `${name}: ${s.state}`)],
        suggested_action: answer.recommendationId ? { type: "suggest_supervised_request", recommendationId: answer.recommendationId } : null, provider_metadata: metadata };
    } catch (error) {
      metadata.failureCode = error instanceof ProviderFailure ? error.code : "unavailable";
      // Invalid requests are configuration errors, not a reason to spend on a fallback.
      stop = metadata.failureCode === "invalid_request";
    } finally { if (timer) clearTimeout(timer); metadata.latencyMs = Date.now() - started; }
    attempts.push(structuredClone(metadata));
    try { log?.({ ...structuredClone(metadata), clientId: snapshot.scope.clientId, organizationId: snapshot.scope.organizationId }); } catch { /* Non-fatal, content-free logging only. */ }
    if (response) return { state: "answered", response: structuredClone(response), attempts };
    failed.push(route.slot);
    if (stop) break;
  }
  return { state: attempts.length ? "provider_unavailable" : "provider_required", message: "I couldn’t complete the analysis right now. No action was taken. Your team can review the question through the existing workflow.", attempts };
}
