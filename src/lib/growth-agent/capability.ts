import type { GrowthAgentContext, Source } from "./contracts";
export type Capability = { state: "supported" | "limited" | "insufficient_data" | "unsupported" | "request"; reason: string };
/** Evaluate the evidence for THIS question, not whether any unrelated row exists. */
export function growthCapability(context: GrowthAgentContext): Capability {
  const { intent, evidence, question } = context;
  if (intent === "request") return { state: "request", reason: "Supervised workflow required; analysis does not save or execute work." };
  if (intent === "unsupported") return { state: "unsupported", reason: "Outside supported business, website, GA4, Search Console, SEO and reports." };
  if (intent === "availability") return { state: "supported", reason: "Source availability can be explained deterministically without a model." };
  if (evidence.sources.business?.state !== "available") return { state: "insufficient_data", reason: "Verified business context unavailable." };
  if (/\b(month|year|week|yesterday|today|90 days|7 days)\b/i.test(question)) return { state: "insufficient_data", reason: "Requested period is not resolved by the current 28-day context builder." };
  const acceptable: Partial<Record<typeof intent, Source[]>> = { website: ["website", "analytics"], analytics: ["analytics"], search: ["search"], seo: ["seo", "search", "website"], performance: ["website", "analytics", "search", "seo", "history"] };
  const relevant = evidence.facts.filter(f => acceptable[intent]?.includes(f.source) && evidence.sources[f.source]?.state === "available");
  if (!relevant.length) return { state: "insufficient_data", reason: "No relevant measured evidence is available for this question." };
  if (/\b(change|changed|drop|dropped|fell|fall|decline|declined|compare|compared)\b/i.test(question) && !relevant.some(f => f.previous !== null && f.changePercent !== null)) return { state: "insufficient_data", reason: "Comparable prior-period measurements are missing." };
  if (/\b(opportunit|improv|prioriti)|\bneed(?:s)? attention\b|\binspect first\b/i.test(question) && !evidence.recommendations.some(r => r.evidenceIds.every(id => relevant.some(f => f.id === id)))) return { state: "insufficient_data", reason: "Available facts do not yet support a linked improvement recommendation." };
  return { state: "limited", reason: "Answer only from cited observations; ingestion coverage, attribution and causal conclusions remain limited." };
}
