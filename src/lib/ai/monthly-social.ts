import type { AIProvider, GenerationContext, SocialConcept, SocialStrategy } from "./provider";

export const abcContext: GenerationContext = {
  clientId: "30000000-0000-4000-8000-000000000001",
  businessKnowledge: "ABC Interiors is a Dubai interior design and renovation studio.",
  services: ["Kitchen Renovation", "Villa Renovation", "Wardrobes", "Interior Fit-out"], offers: ["Free initial design consultation"],
  prohibitedClaims: ["Prices", "Guarantees", "Certifications", "Testimonials", "Statistics", "Services outside Dubai and Sharjah"],
  recentContent: ["From dated to designed", "Villa renovation checklist", "Storage that disappears", "Material moodboard", "Before the renovation", "Wardrobe details", "Open-plan balance", "Site progress", "Kitchen workflow", "Renovation questions", "Dubai design", "November recap"],
  toneOfVoice: "premium, practical and calm", locations: ["Dubai", "Sharjah"],
};

export type PreparedSocialPlan = { month: string; strategy: SocialStrategy; concepts: SocialConcept[]; provider: string; model: string; usage: { inputTokens: number; outputTokens: number; estimatedCost: number }; imageMode: "manual"; promptVersions: { strategy: string; brief: string; caption: string; posterPrompt: string } };

export async function prepareMonthlySocial(provider: AIProvider, month: string, count = 12, context: GenerationContext = abcContext): Promise<PreparedSocialPlan> {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("month must use YYYY-MM");
  if (count < 1 || count > 31) throw new Error("count must be between 1 and 31");
  const [strategyResult, generated] = await Promise.all([provider.generateSocialStrategy(context, month, count), provider.generateSocialPlan(context, month, count)]);
  if (generated.data.length !== count) throw new Error(`provider returned ${generated.data.length} concepts; expected ${count}`);
  const topics = new Set(generated.data.map((item) => item.topic.trim().toLowerCase()));
  const headlines = new Set(generated.data.map((item) => item.posterHeadline.trim().toLowerCase()));
  if (topics.size !== count || headlines.size !== count) throw new Error("provider returned repeated topics or headlines");
  for (const [index, item] of generated.data.entries()) {
    if (!item.caption || !item.creativeBrief || !item.imagePrompt || !item.cta || !item.posterHeadline || !item.objective || !item.platform || !item.suggestedDate) throw new Error(`provider returned incomplete content for post ${index + 1}`);
    if (!item.suggestedDate.startsWith(month)) throw new Error(`post ${index + 1} is outside the selected month`);
  }
  const strategy = strategyResult.data;
  if (!strategy.monthlyObjective || !strategy.primaryCta || !strategy.priorityTopics?.length || !strategy.contentThemes?.length) throw new Error("provider returned an incomplete monthly strategy");
  return { month, strategy, concepts: generated.data.map((item, index) => ({ ...item, postNumber: index + 1 })), provider: generated.provider, model: generated.model,
    usage: { inputTokens: (strategyResult.usage?.inputTokens ?? 0) + (generated.usage?.inputTokens ?? 0), outputTokens: (strategyResult.usage?.outputTokens ?? 0) + (generated.usage?.outputTokens ?? 0), estimatedCost: (strategyResult.usage?.estimatedCost ?? 0) + (generated.usage?.estimatedCost ?? 0) },
    imageMode: "manual", promptVersions: { strategy: "social_strategy_v1", brief: "post_brief_v1", caption: "caption_v1", posterPrompt: "poster_prompt_v1" } };
}

export const generateMonthlySocialStrategy = (provider: AIProvider, month: string, count: number, context: GenerationContext) => provider.generateSocialStrategy(context, month, count);
export const generatePostBriefs = (provider: AIProvider, month: string, count: number, context: GenerationContext) => provider.generateSocialPlan(context, month, count);
export const generateCaption = (provider: AIProvider, context: GenerationContext, concept: string) => provider.generateCaption(context, concept);
export const generatePosterPrompt = (provider: AIProvider, context: GenerationContext, concept: string) => provider.generateCreativeBrief(context, concept);
