import type { GrowthIntent, Source } from "./contracts";

export function routeGrowthIntent(question: string): GrowthIntent {
  const q = question.trim().toLowerCase();
  // Unsupported domains win even when the sentence also mentions traffic or SEO.
  if (/\b(meta|facebook|instagram|whatsapp|chatbot|competitor|campaigns?|paid ads?|google ads|social media)\b/.test(q)) return "unsupported";
  if (/\b(what data|missing data|(?:data|information).*(?:missing|not have|available)|connected sources)\b/.test(q)) return "availability";
  // Advice questions do not silently create work. Actual creation still requires the
  // existing transactional workflow; this classifier is not permission to execute.
  if (/^(?:please\s+|can you\s+|could you\s+|would you\s+)?(?:fix|add|create|update|change|publish|implement|remove|schedule|rewrite)\b/.test(q)) return "request";
  if (/\b(seo|ranking|rankings|keyword|keywords|best.*opportunity|page.*improve)\b/.test(q)) return "seo";
  if (/\b(google|search console|organic|impressions|ctr)\b/.test(q)) return "search";
  if (/\b(traffic|visitors|sessions|analytics|ga4|users)\b/.test(q)) return "analytics";
  if (/\b(website|page|pages|site|metadata|inspect)\b/.test(q)) return "website";
  if (/\b(performance|performing|improve|focus|changed|change|growth|week|month)\b/.test(q)) return "performance";
  return "unsupported";
}

export const intentSources: Record<GrowthIntent, readonly Source[]> = {
  website: ["business", "website", "analytics", "history"],
  analytics: ["business", "analytics", "search", "history"],
  search: ["business", "search", "seo", "history"],
  seo: ["business", "website", "search", "seo"],
  performance: ["business", "website", "analytics", "search", "seo", "history"],
  availability: ["business", "website", "analytics", "search", "seo", "history"],
  request: [],
  unsupported: [],
};
