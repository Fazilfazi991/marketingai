/** Server-built evidence contracts. No arbitrary database records or executable actions. */
export type GrowthIntent = "website" | "analytics" | "search" | "seo" | "performance" | "request" | "unsupported" | "availability";
export type Source = "business" | "website" | "analytics" | "search" | "seo" | "history";
export type Period = { from: string; to: string };
export type SourceState = { state: "available" | "missing" | "unavailable" | "truncated"; through: string | null };
export type Fact = {
  id: string;
  source: Source;
  label: string;
  value: number | string;
  unit: "count" | "percent" | "position" | "text";
  period: Period | null;
  previous: number | null;
  changePercent: number | null;
  calculation: string;
  page?: string;
  query?: string;
};
export type Recommendation = { id: string; text: string; evidenceIds: string[]; page?: string; query?: string };
export type EvidencePacket = {
  version: "growth-v1";
  facts: Fact[];
  recommendations: Recommendation[];
  sources: Partial<Record<Source, SourceState>>;
  limitations: string[];
};
export type BusinessContext = {
  name: string;
  description: string;
  services: string[];
  locations: string[];
  targetCustomers: string;
  valueProposition: string;
  offers: string;
  importantClaims: string;
  prohibitedClaims: string;
  tone: string;
  verifiedFaqs: { question: string; answer: string }[];
};
export type GrowthAgentContext = {
  /** Server-only ownership metadata, deliberately omitted from provider payloads. */
  scope: { clientId: string; organizationId: string; userId: string };
  question: string;
  intent: GrowthIntent;
  business: BusinessContext;
  evidence: EvidencePacket;
  conversation: { role: "client" | "staff"; text: string }[];
  contextDurationMs: number;
};
export type GroundedAnswer = {
  answer: string;
  whyItMatters: string;
  evidenceIds: string[];
  recommendationId: string | null;
  dataQuality: "sufficient" | "limited";
};
export interface GroundedAgentProvider {
  generateGroundedAnswer(input: {
    question: string;
    intent: GrowthIntent;
    business: BusinessContext;
    evidence: EvidencePacket;
    conversation: GrowthAgentContext["conversation"];
    permittedActions: readonly ["suggest_supervised_request"];
  }, signal: AbortSignal): Promise<unknown>;
}
