import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars -- Supabase's generated schema does not yet include this migration. */

import type { AIProvider, GenerationContext } from "./ai/provider";
import { prepareMonthlyBlogs } from "./ai/monthly-blog";

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 90);
const list = (value: unknown) =>
  String(value ?? "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
type OpportunityRow = {
  id: string;
  title: string;
  affected_query: string | null;
  target_url: string | null;
  opportunity_type: string | null;
  evidence: Record<string, unknown> | null;
  recommendation: string | null;
  impact: string | null;
};

export function selectBlogCandidates(input: {
  opportunities: OpportunityRow[];
  existingTopics: string[];
  count: number;
}) {
  const existing = input.existingTopics.map((value) => value.toLowerCase()),
    seen = new Set<string>(),
    rank = { high: 0, medium: 1, low: 2 };
  return input.opportunities
    .sort(
      (a, b) =>
        (rank[a.impact as keyof typeof rank] ?? 2) -
        (rank[b.impact as keyof typeof rank] ?? 2),
    )
    .flatMap((item) => {
      const keyword = (item.affected_query ?? "").trim();
      if (
        !keyword ||
        item.opportunity_type === "metadata" ||
        item.opportunity_type === "declining"
      )
        return [];
      const key = keyword.toLowerCase();
      if (
        seen.has(key) ||
        existing.some((topic) => topic.includes(key) || key.includes(topic))
      )
        return [];
      seen.add(key);
      return [
        {
          keyword,
          intent:
            item.opportunity_type === "striking_distance"
              ? "Commercial investigation"
              : "Informational",
          opportunityId: item.id,
          reason: item.recommendation ?? item.title,
          targetUrl: item.target_url,
          evidence: item.evidence ?? {},
        },
      ];
    })
    .slice(0, input.count);
}

export async function runBlogFactory(
  supabase: any,
  provider: AIProvider,
  clientId: string,
  month: string,
  _userId: string,
) {
  const [
    clientResult,
    profileResult,
    servicesResult,
    locationsResult,
    scopeResult,
    opportunitiesResult,
    pagesResult,
    existingResult,
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("id,name,industry,city,country,organization_id")
      .eq("id", clientId)
      .single(),
    supabase
      .from("business_profiles")
      .select(
        "description,target_customers,value_proposition,tone_of_voice,offers,important_claims,prohibited_claims",
      )
      .eq("client_id", clientId)
      .maybeSingle(),
    supabase
      .from("business_services")
      .select("name")
      .eq("client_id", clientId)
      .eq("status", "active"),
    supabase
      .from("business_locations")
      .select("name")
      .eq("client_id", clientId)
      .eq("status", "active"),
    supabase
      .from("client_service_scopes")
      .select("monthly_quantity")
      .eq("client_id", clientId)
      .eq("service_key", "blogs")
      .eq("enabled", true)
      .maybeSingle(),
    supabase
      .from("seo_tasks")
      .select(
        "id,title,affected_query,target_url,opportunity_type,evidence,recommendation,impact",
      )
      .eq("client_id", clientId)
      .in("status", ["suggested", "reviewed", "approved"])
      .order("created_at", { ascending: false }),
    supabase
      .from("seo_pages")
      .select("url,canonical_url,title,page_type,indexable")
      .eq("client_id", clientId)
      .eq("indexable", true),
    supabase
      .from("content_items")
      .select("topic,target_keyword")
      .eq("client_id", clientId)
      .eq("content_kind", "blog"),
  ]);
  for (const result of [
    clientResult,
    profileResult,
    servicesResult,
    locationsResult,
    scopeResult,
    opportunitiesResult,
    pagesResult,
    existingResult,
  ])
    if (result.error) throw result.error;
  const count = Number(scopeResult.data?.monthly_quantity ?? 2);
  if (!Number.isInteger(count) || count < 1 || count > 10)
    throw new Error(
      "Blog service scope must configure between 1 and 10 articles.",
    );
  const existingTopics = (existingResult.data ?? [])
      .flatMap((item: any) => [
        String(item.topic ?? "").toLowerCase(),
        String(item.target_keyword ?? "").toLowerCase(),
      ])
      .filter(Boolean),
    candidates = selectBlogCandidates({
      opportunities: opportunitiesResult.data ?? [],
      existingTopics,
      count,
    });
  if (candidates.length < count)
    throw new Error(
      `Only ${candidates.length} evidence-backed, non-duplicate blog topics are available; ${count} configured. Review SEO opportunities instead of inventing quota content.`,
    );
  const profile = profileResult.data,
    services = (servicesResult.data ?? []).map((row: any) => String(row.name)),
    locations = (locationsResult.data ?? []).map((row: any) =>
      String(row.name),
    ),
    pages = (pagesResult.data ?? []).map((row: any) => ({
      url: String(row.canonical_url ?? row.url),
      title: String(row.title ?? "Existing page"),
      type: String(row.page_type),
    })),
    context: GenerationContext = {
      clientId,
      businessKnowledge: JSON.stringify({
        client: clientResult.data,
        profile,
        locations,
        verifiedClaims: list(profile?.important_claims),
        websitePages: pages,
        topicEvidence: candidates,
      }),
      services,
      locations,
      offers: list(profile?.offers),
      prohibitedClaims: list(profile?.prohibited_claims),
      recentContent: existingTopics,
      toneOfVoice: String(profile?.tone_of_voice ?? ""),
    };
  const jobResult = await supabase
    .from("automation_jobs")
    .select("id")
    .eq("organization_id", clientResult.data.organization_id)
    .eq("workflow_key", "BLOG_FACTORY")
    .maybeSingle();
  if (jobResult.error) throw jobResult.error;
  let runId: string | null = null;
  if (jobResult.data?.id) {
    const { data: run, error } = await supabase
      .from("automation_runs")
      .insert({
        job_id: jobResult.data.id,
        client_id: clientId,
        status: "running",
        input_reference: { month, count },
        metadata: { trigger: "blog_workspace", engine: "growth1000" },
      })
      .select("id")
      .single();
    if (error) throw error;
    runId = String(run.id);
  }
  const started = Date.now();
  try {
    const generated = await prepareMonthlyBlogs(
      provider,
      context,
      month,
      count,
      candidates,
    );
    const perArticle = generated.estimatedCost / count,
      rows = generated.blogs.map((blog, index) => {
        const candidate = candidates[index],
          slug = slugify(blog.topic),
          targetLinks = pages
            .filter((page: { url: string }) => page.url !== candidate.targetUrl)
            .slice(0, 3)
            .map((page: { url: string; title: string }) => ({
              direction: "to",
              url: page.url,
              anchorText: page.title,
            })),
          sourceLinks =
            candidate.targetUrl &&
            pages.some((page: { url: string }) => page.url === candidate.targetUrl)
              ? [
                  {
                    direction: "from",
                    url: candidate.targetUrl,
                    anchorText: `Learn more about ${candidate.keyword}`,
                  },
                ]
              : [],
          researchBrief = {
            primaryTopic: candidate.keyword,
            searchIntent: candidate.intent,
            targetAudience:
              profile?.target_customers ?? "Client's target customers",
            supportingQueries: [],
            relevantPages: [
              candidate.targetUrl,
              ...targetLinks.map((link: { url: string }) => link.url),
            ].filter(Boolean),
            verifiedFacts: list(profile?.important_claims),
            prohibitedClaims: list(profile?.prohibited_claims),
            angle: candidate.reason,
            cta: blog.cta,
            externalResearch:
              "Unavailable; draft uses first-party Search Console, website inventory and business knowledge only.",
            evidence: candidate.evidence,
          };
        return {
          client_id: clientId,
          automation_run_id: runId,
          content_kind: "blog",
          month: `${month}-01`,
          topic: blog.topic,
          target_keyword: blog.targetKeyword,
          concept: blog.brief,
          body: blog.body,
          seo_metadata: {
            intent: blog.seoMetadata.intent,
            title: blog.seoMetadata.title,
            description: blog.seoMetadata.description,
          },
          status: "needs_review",
          source_opportunity_id: candidate.opportunityId,
          slug,
          research_brief: researchBrief,
          internal_links: [...sourceLinks, ...targetLinks],
          canonical_recommendation: candidate.targetUrl
            ? `${new URL(candidate.targetUrl).origin}/${slug}`
            : null,
          featured_image_prompt: blog.featuredImagePrompt,
          structured_data_recommendation: blog.structuredDataRecommendation,
          implementation_package: {
            targetWebsite: pages[0]?.url ? new URL(pages[0].url).origin : null,
            slug,
            metadata: blog.seoMetadata,
            internalLinks: [...sourceLinks, ...targetLinks],
            cta: blog.cta,
            imagePrompt: blog.featuredImagePrompt,
            structuredData: blog.structuredDataRecommendation,
            boundary: "admin_review",
          },
          prompt_version: "blog_factory_v1",
          generation_provider: generated.provider,
          generation_model: generated.model,
          generation_status: "complete",
          estimated_cost: perArticle,
        };
      });
    const { data: inserted, error } = await supabase
      .from("content_items")
      .insert(rows)
      .select("id");
    if (error) throw error;
    if (runId)
      await supabase
        .from("automation_runs")
        .update({
          status: "succeeded",
          finished_at: new Date().toISOString(),
          cost: generated.estimatedCost,
          provider: generated.provider,
          model: generated.model,
          output_reference: {
            blog_records: inserted?.length ?? 0,
            status: "needs_review",
            duration_ms: Date.now() - started,
          },
        })
        .eq("id", runId);
    return {
      count: inserted?.length ?? 0,
      provider: generated.provider,
      model: generated.model,
      estimatedCost: generated.estimatedCost,
    };
  } catch (error) {
    if (runId)
      await supabase
        .from("automation_runs")
        .update({
          status: "failed",
          finished_at: new Date().toISOString(),
          output_reference: { duration_ms: Date.now() - started },
        })
        .eq("id", runId);
    throw error;
  }
}
