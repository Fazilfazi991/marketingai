import "server-only";
import type { GrowthAgentContext } from "./contracts";
import { initialPolicy, validateRoutingPolicy, type ModelSlot, type RoutingPolicy } from "./model-config";

export type RoutingSignals = {
  intent: GrowthAgentContext["intent"]; domains: number; factCount: number;
  multiPeriod: boolean; conflictingSignals: boolean;
  reasoning: "routine" | "deep"; conversationType: "initial" | "follow_up";
};
export function routingSignals(context: GrowthAgentContext): RoutingSignals {
  const changes = context.evidence.facts.map(f => f.changePercent).filter((n): n is number => typeof n === "number" && n !== 0);
  return { intent: context.intent,
    domains: new Set(context.evidence.facts.map(f => f.source)).size,
    factCount: context.evidence.facts.length,
    multiPeriod: context.evidence.facts.some(f => f.previous !== null) || new Set(context.evidence.facts.map(f => JSON.stringify(f.period)).filter(p => p !== "null")).size > 1,
    conflictingSignals: changes.some(n => n > 0) && changes.some(n => n < 0),
    reasoning: /\b(why|prioriti[sz]e|strategy|strategic|conflicting|declin|drop)/i.test(context.question) ? "deep" : "routine",
    conversationType: context.conversation.length ? "follow_up" : "initial" };
}
export function routeGrowthModel(signals: RoutingSignals, available: Partial<Record<ModelSlot, boolean>>, policy: RoutingPolicy = initialPolicy, failed: ModelSlot[] = []) {
  const p = validateRoutingPolicy(policy);
  if (["unsupported", "request", "availability"].includes(signals.intent)) return null;
  const complex = signals.conflictingSignals || signals.multiPeriod || signals.factCount >= p.complexFacts || (signals.reasoning === "deep" && signals.domains >= p.complexDomains);
  const preferred = complex ? p.complexSlot : p.defaultSlot;
  const candidates = [preferred, ...p.fallbacks[preferred]];
  const slot = candidates.find(s => available[s] && !failed.includes(s));
  return slot ? { slot, preferred, fallback: slot !== preferred || failed.length > 0,
    reason: slot !== preferred || failed.length ? "configured_fallback" : complex ? "complex_evidence" : signals.conversationType === "follow_up" ? "routine_follow_up" : "routine_evidence" } : null;
}
