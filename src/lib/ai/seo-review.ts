import type { GenerationContext, AIProvider } from "./provider";

export type SeoReviewKeyword = { keyword: string; target_url: string | null; current_position: number | null; previous_position: number | null; priority: string | null; notes: string | null };
export type SeoReviewTask = { opportunity: string; title: string; target_url: string | null; impact: "high" | "medium" | "low"; status: "awaiting_review"; notes: string };

export async function prepareSeoReview(provider: AIProvider, context: GenerationContext, keywords: SeoReviewKeyword[], existingTitles: string[] = []) {
  if (!keywords.length) throw new Error("No tracked keywords are available for SEO review");
  const input = JSON.stringify({ instruction: "Identify concrete, evidence-based SEO actions. Do not invent traffic, ranking, client or competitor facts. Return concise implementation actions only.", keywords });
  const generated = await provider.analyzeSEO(context, input);
  const existing = new Set(existingTitles.map(title => title.trim().toLowerCase()));
  const seen = new Set<string>();
  const actions = generated.data.map(item => item.trim().replace(/^[-*\d.)\s]+/, "")).filter(item => {
    const key = item.toLowerCase();
    if (!item || existing.has(key) || seen.has(key)) return false;
    seen.add(key); return true;
  }).slice(0, 8);
  if (!actions.length) throw new Error("AI provider returned no new SEO actions");
  const tasks: SeoReviewTask[] = actions.map((title, index) => {
    const keyword = keywords[index % keywords.length];
    const position = Number(keyword.current_position) || null;
    const impact = position && position <= 20 ? "high" : keyword.priority === "high" ? "high" : "medium";
    return { opportunity: title.slice(0, 500), title: title.slice(0, 180), target_url: keyword.target_url, impact, status: "awaiting_review", notes: `Generated from tracked keyword “${keyword.keyword}”${position ? ` at position ${position}` : ""}. Human review required before implementation.` };
  });
  return { tasks, provider: generated.provider, model: generated.model, estimatedCost: generated.usage?.estimatedCost ?? 0 };
}
