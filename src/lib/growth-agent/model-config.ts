import "server-only";

export type ModelSlot = "deepseekFlash" | "deepseekPro" | "glmFlash";
export type ProviderName = "deepseek" | "glm";
export const modelCatalog = {
  // Official docs now route the V4 Flash alias to V4.1. Do not silently substitute.
  deepseekFlash: { provider: "deepseek", model: "deepseek-v4-flash", endpoint: "https://api.deepseek.com/chat/completions", blocked: "Accepted API alias; live official docs identify served version as V4.1 Flash. Served-version approval required." },
  deepseekPro: { provider: "deepseek", model: "deepseek-v4-pro", endpoint: "https://api.deepseek.com/chat/completions", blocked: null },
  glmFlash: { provider: "glm", model: "glm-5.3-flash", endpoint: "https://api.z.ai/api/paas/v4/chat/completions", blocked: null },
} as const;
export const slots = Object.keys(modelCatalog) as ModelSlot[];
export type RoutingPolicy = {
  defaultSlot: ModelSlot; complexSlot: ModelSlot;
  fallbacks: Record<ModelSlot, ModelSlot[]>;
  complexDomains: number; complexFacts: number;
  maxAttempts: number; timeoutMs: number;
};
export const initialPolicy: RoutingPolicy = {
  defaultSlot: "deepseekFlash", complexSlot: "deepseekPro",
  fallbacks: { deepseekFlash: ["glmFlash"], deepseekPro: ["deepseekFlash", "glmFlash"], glmFlash: [] },
  complexDomains: 2, complexFacts: 12, maxAttempts: 2, timeoutMs: 20000,
};
export function validateRoutingPolicy(value: unknown): RoutingPolicy {
  const p = value as RoutingPolicy;
  if (!p || typeof p !== "object" || Object.keys(p).sort().join() !== Object.keys(initialPolicy).sort().join() || !slots.includes(p.defaultSlot) || !slots.includes(p.complexSlot) ||
    !p.fallbacks || Object.keys(p.fallbacks).sort().join() !== slots.slice().sort().join() ||
    slots.some(s => !Array.isArray(p.fallbacks[s]) || p.fallbacks[s].length > 2 || new Set(p.fallbacks[s]).size !== p.fallbacks[s].length || p.fallbacks[s].some(t => !slots.includes(t) || t === s)) ||
    !Number.isInteger(p.complexDomains) || p.complexDomains < 2 || p.complexDomains > 6 ||
    !Number.isInteger(p.complexFacts) || p.complexFacts < 2 || p.complexFacts > 50 ||
    !Number.isInteger(p.maxAttempts) || p.maxAttempts < 1 || p.maxAttempts > 3 ||
    !Number.isInteger(p.timeoutMs) || p.timeoutMs < 100 || p.timeoutMs > 30000) throw new Error("Invalid Growth Agent routing policy.");
  return structuredClone(p);
}
export type ModelConfiguration = {
  callsEnabled: boolean; policy: RoutingPolicy;
  models: Record<ModelSlot, { provider: ProviderName; model: string | null; endpoint: string; apiKey: string; available: boolean; blocked: string | null }>;
};
/** Never send this configuration to the browser or log it: it contains keys. */
export function readModelConfiguration(env: Record<string, string | undefined> = process.env): ModelConfiguration {
  const flag = env.GROWTH_AGENT_ALLOW_PROVIDER_CALLS;
  if (flag && flag !== "true" && flag !== "false") throw new Error("Invalid provider-call gate.");
  if (Object.keys(env).some(k => k.startsWith("NEXT_PUBLIC_GROWTH_AGENT") || /^NEXT_PUBLIC_(DEEPSEEK|GLM).*KEY$/.test(k))) throw new Error("Provider configuration must be server-only.");
  const policy = env.GROWTH_AGENT_ROUTING_POLICY ? validateRoutingPolicy(JSON.parse(env.GROWTH_AGENT_ROUTING_POLICY)) : structuredClone(initialPolicy);
  const models = {} as ModelConfiguration["models"];
  const modelEnv = { deepseekFlash: "GROWTH_AGENT_DEEPSEEK_FLASH_MODEL", deepseekPro: "GROWTH_AGENT_DEEPSEEK_PRO_MODEL", glmFlash: "GROWTH_AGENT_GLM_FLASH_MODEL" };
  for (const slot of slots) {
    const entry = modelCatalog[slot];
    const requested = env[modelEnv[slot]]?.trim();
    if (requested && requested !== entry.model) throw new Error(`Unsupported or unapproved model configuration for ${slot}.`);
    const apiKey = (env[entry.provider === "deepseek" ? "GROWTH_AGENT_DEEPSEEK_API_KEY" : "GROWTH_AGENT_GLM_API_KEY"] ?? "").trim();
    if (/\s/.test(apiKey)) throw new Error(`Invalid credential format for ${entry.provider}.`);
    models[slot] = { ...entry, apiKey, available: Boolean(!entry.blocked && entry.model && apiKey && flag === "true") };
  }
  return { callsEnabled: flag === "true", policy, models };
}
