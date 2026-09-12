import type { AIProvider, GenerationContext } from "./provider";

export type BlogCandidate = { keyword: string; intent?: string | null };
export type PreparedBlog = { topic: string; targetKeyword: string; brief: string; body: string; seoMetadata: { intent: string; title: string; description: string };cta:string;featuredImagePrompt:string;structuredDataRecommendation:string };

const titleFor = (keyword: string) => `A practical guide to ${keyword}`.replace(/\b\w/g, letter => letter.toUpperCase());
const descriptionFrom = (body: string) => {
  const plain = body.replace(/[#*_`]/g, "").replace(/\s+/g, " ").trim();
  const clipped = plain.slice(0, 155).replace(/\s+\S*$/, "").trim();
  return clipped + (plain.length > 155 ? "…" : "");
};

export async function prepareMonthlyBlogs(provider: AIProvider, context: GenerationContext, month: string, count: number, candidates: BlogCandidate[]) {
  if (!/^\d{4}-\d{2}$/.test(month)) throw new Error("month must use YYYY-MM");
  if (!Number.isInteger(count) || count < 1 || count > 10) throw new Error("blog count must be between 1 and 10");
  const unique = [...new Map(candidates.map(item => [item.keyword.trim().toLowerCase(), { ...item, keyword: item.keyword.trim() }])).values()].filter(item => item.keyword);
  if (unique.length < count) throw new Error(`Only ${unique.length} verified blog topics are available; ${count} required`);
  const blogs: PreparedBlog[] = [];
  let estimatedCost = 0, providerName = "", model = "";
  for (const candidate of unique.slice(0, count)) {
    const topic = titleFor(candidate.keyword);
    const brief = await provider.generateBlogBrief(context, `${candidate.keyword}. Working title: ${topic}. Month: ${month}.`);
    const draft = await provider.generateBlogDraft(context, brief.data);
    if (!brief.data.trim() || !draft.data.trim()) throw new Error(`Provider returned incomplete blog content for ${candidate.keyword}`);
    providerName = draft.provider; model = draft.model;
    estimatedCost += (brief.usage?.estimatedCost ?? 0) + (draft.usage?.estimatedCost ?? 0);
    blogs.push({ topic, targetKeyword: candidate.keyword, brief: brief.data, body: draft.data, seoMetadata: { intent: candidate.intent || "Informational", title: topic.slice(0, 60), description: descriptionFrom(draft.data) },cta:context.offers[0]||"Contact the team to discuss your requirements.",featuredImagePrompt:`Create an editorial featured image for “${topic}”. Reflect the verified service context without logos, text, prices, awards, testimonials or unverified claims.`,structuredDataRecommendation:"Article structured data; include FAQPage only when the final reviewed article contains genuine FAQs." });
  }
  return { blogs, provider: providerName, model, estimatedCost };
}
