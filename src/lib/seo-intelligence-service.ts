import "server-only";
/* eslint-disable @typescript-eslint/no-explicit-any -- Supabase's generated schema does not yet include this migration. */

type SearchRow = {
  day: string;
  query: string;
  page: string;
  metrics: Record<string, unknown>;
  is_demo?: boolean;
};
type InventoryPage = {
  id: string;
  url: string;
  canonical_url: string | null;
  title: string | null;
  meta_description: string | null;
  h1: string | null;
  page_type: string;
  indexable: boolean | null;
  last_inspected_at: string | null;
};
export type SeoOpportunity = {
  opportunityType:
    | "striking_distance"
    | "low_ctr"
    | "declining"
    | "growing"
    | "content_gap"
    | "internal_link"
    | "metadata"
    | "conversion"
    | "service_support";
  title: string;
  query: string | null;
  targetUrl: string | null;
  priority: "high" | "medium" | "low";
  confidence: "high" | "medium" | "low";
  observed: string;
  recommendation: string;
  expectedImpact: string;
  evidence: Record<string, unknown>;
};

const number = (value: unknown) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;
const aggregate = (rows: SearchRow[]) => {
  const map = new Map<
    string,
    {
      query: string;
      page: string;
      clicks: number;
      impressions: number;
      positionWeighted: number;
    }
  >();
  for (const row of rows) {
    const key = `${row.query}\n${row.page}`,
      current = map.get(key) ?? {
        query: row.query,
        page: row.page,
        clicks: 0,
        impressions: 0,
        positionWeighted: 0,
      },
      impressions = number(row.metrics.impressions);
    current.clicks += number(row.metrics.clicks);
    current.impressions += impressions;
    current.positionWeighted +=
      number(row.metrics.position) * Math.max(impressions, 1);
    map.set(key, current);
  }
  return [...map.values()].map((row) => ({
    ...row,
    ctr: row.impressions ? row.clicks / row.impressions : 0,
    position: row.positionWeighted / Math.max(row.impressions, 1),
  }));
};
const pageFor = (pages: InventoryPage[], url: string) =>
  pages.find((page) => page.url === url || page.canonical_url === url);
const priorityFor = (
  impressions: number,
  position: number,
  businessRelevant: boolean,
): "high" | "medium" | "low" =>
  businessRelevant && (impressions >= 100 || (position >= 8 && position <= 20))
    ? "high"
    : impressions >= 25
      ? "medium"
      : "low";

export function identifySeoOpportunities(input: {
  current: SearchRow[];
  previous: SearchRow[];
  pages: InventoryPage[];
  services: string[];
  previousTitles: string[];
}): SeoOpportunity[] {
  const current = aggregate(input.current),
    previous = aggregate(input.previous),
    existing = new Set(
      input.previousTitles.map((value) => value.toLowerCase()),
    ),
    serviceTerms = input.services.flatMap((service) =>
      service
        .toLowerCase()
        .split(/\W+/)
        .filter((word) => word.length > 3),
    );
  const opportunities: SeoOpportunity[] = [];
  for (const metric of current.sort((a, b) => b.impressions - a.impressions)) {
    const page = pageFor(input.pages, metric.page),
      businessRelevant = serviceTerms.some(
        (term) =>
          metric.query.toLowerCase().includes(term) ||
          metric.page.toLowerCase().includes(term),
      ),
      priority = priorityFor(
        metric.impressions,
        metric.position,
        businessRelevant,
      ),
      evidence = {
        clicks: metric.clicks,
        impressions: metric.impressions,
        ctr: Number((metric.ctr * 100).toFixed(2)),
        averagePosition: Number(metric.position.toFixed(1)),
        page: metric.page,
      };
    if (
      metric.position >= 8 &&
      metric.position <= 20 &&
      metric.impressions >= 10
    )
      opportunities.push({
        opportunityType: "striking_distance",
        title: `Strengthen ${metric.query} coverage near page one`,
        query: metric.query,
        targetUrl: page?.canonical_url ?? page?.url ?? metric.page,
        priority,
        confidence: "high",
        observed: `${metric.impressions} impressions at average position ${metric.position.toFixed(1)}.`,
        recommendation: `Strengthen the existing page around the search intent for “${metric.query}”, review FAQ coverage and add relevant internal links.`,
        expectedImpact:
          "Improve qualified organic visibility and click potential.",
        evidence,
      });
    if (metric.impressions >= 25 && metric.ctr < 0.02)
      opportunities.push({
        opportunityType: "low_ctr",
        title: `Improve the search snippet for ${metric.query}`,
        query: metric.query,
        targetUrl: page?.canonical_url ?? page?.url ?? metric.page,
        priority,
        confidence: metric.impressions >= 100 ? "high" : "medium",
        observed: `${metric.impressions} impressions produced ${metric.clicks} clicks (${(metric.ctr * 100).toFixed(1)}% CTR).`,
        recommendation:
          "Review the title and meta description against the observed query intent; keep claims specific and verified.",
        expectedImpact: "Increase clicks from existing search visibility.",
        evidence,
      });
    const prior = previous.find(
      (row) => row.query === metric.query && row.page === metric.page,
    );
    if (prior && prior.impressions >= 10) {
      const change =
        (metric.impressions - prior.impressions) / prior.impressions;
      if (change >= 0.25)
        opportunities.push({
          opportunityType: "growing",
          title: `Support growing demand for ${metric.query}`,
          query: metric.query,
          targetUrl: page?.canonical_url ?? page?.url ?? metric.page,
          priority,
          confidence: "medium",
          observed: `Impressions increased ${Math.round(change * 100)}% versus the comparable period.`,
          recommendation:
            "Protect the momentum with deeper supporting information and links from relevant existing pages.",
          expectedImpact: "Consolidate an evidenced upward visibility trend.",
          evidence: {
            ...evidence,
            previousImpressions: prior.impressions,
            impressionChangePercent: Math.round(change * 100),
          },
        });
      if (change <= -0.25)
        opportunities.push({
          opportunityType: "declining",
          title: `Investigate declining visibility for ${metric.query}`,
          query: metric.query,
          targetUrl: page?.canonical_url ?? page?.url ?? metric.page,
          priority: priority === "low" ? "medium" : priority,
          confidence: "medium",
          observed: `Impressions decreased ${Math.abs(Math.round(change * 100))}% versus the comparable period.`,
          recommendation:
            "Review recent page changes, intent alignment, indexability and competing internal pages before editing content.",
          expectedImpact: "Diagnose and recover lost organic visibility.",
          evidence: {
            ...evidence,
            previousImpressions: prior.impressions,
            impressionChangePercent: Math.round(change * 100),
          },
        });
    }
  }
  for (const page of input.pages.filter((page) => page.indexable !== false)) {
    const missing = [
      !page.title && "title",
      !page.meta_description && "meta description",
      !page.h1 && "H1",
    ].filter(Boolean);
    if (missing.length)
      opportunities.push({
        opportunityType: "metadata",
        title: `Complete on-page signals for ${new URL(page.url).pathname || "homepage"}`,
        query: null,
        targetUrl: page.canonical_url ?? page.url,
        priority: page.page_type === "service" ? "high" : "medium",
        confidence: "high",
        observed: `The inspected page is missing: ${missing.join(", ")}.`,
        recommendation: `Add a specific ${missing.join(", ")} aligned with the page’s actual purpose and verified offer.`,
        expectedImpact:
          "Clarify page relevance for search engines and visitors.",
        evidence: { url: page.url, missing },
      });
  }
  for (const service of input.services) {
    const words = service
        .toLowerCase()
        .split(/\W+/)
        .filter((word) => word.length > 3),
      covered = input.pages.some((page) =>
        words.some((word) =>
          `${page.url} ${page.title ?? ""} ${page.h1 ?? ""}`
            .toLowerCase()
            .includes(word),
        ),
      );
    if (!covered)
      opportunities.push({
        opportunityType: "service_support",
        title: `Evaluate content support for ${service}`,
        query: null,
        targetUrl: null,
        priority: "medium",
        confidence: "medium",
        observed: `No strong matching page was found in the latest website inventory for the active service “${service}”.`,
        recommendation:
          "Confirm search demand and customer questions before choosing between a service page improvement and a supporting article.",
        expectedImpact:
          "Close a commercially relevant content gap without inventing demand.",
        evidence: { service, inventoryPages: input.pages.length },
      });
  }
  const unique = new Map<string, SeoOpportunity>();
  for (const item of opportunities) {
    const key =
      `${item.opportunityType}:${item.query ?? item.targetUrl ?? item.title}`.toLowerCase();
    if (!existing.has(item.title.toLowerCase()) && !unique.has(key))
      unique.set(key, item);
  }
  return [...unique.values()]
    .sort(
      (a, b) =>
        ({ high: 0, medium: 1, low: 2 })[a.priority] -
        { high: 0, medium: 1, low: 2 }[b.priority],
    )
    .slice(0, 20);
}

export async function runSeoIntelligence(
  supabase: any,
  clientId: string,
  period: { from: string; to: string },
  userId: string,
) {
  const started = Date.now(),
    from = new Date(`${period.from}T00:00:00Z`),
    to = new Date(`${period.to}T00:00:00Z`),
    days = Math.max(
      1,
      Math.round((to.getTime() - from.getTime()) / 86400000) + 1,
    ),
    previousTo = new Date(from);
  previousTo.setUTCDate(previousTo.getUTCDate() - 1);
  const previousFrom = new Date(previousTo);
  previousFrom.setUTCDate(previousFrom.getUTCDate() - days + 1);
  const [
    currentResult,
    previousResult,
    pagesResult,
    servicesResult,
    previousTasksResult,
    analyticsResult,
    pageAnalyticsResult,
    leadsResult,
    blogsResult,
  ] = await Promise.all([
    supabase
      .from("search_console_daily")
      .select("day,query,page,metrics,is_demo")
      .eq("client_id", clientId)
      .gte("day", period.from)
      .lte("day", period.to),
    supabase
      .from("search_console_daily")
      .select("day,query,page,metrics,is_demo")
      .eq("client_id", clientId)
      .gte("day", previousFrom.toISOString().slice(0, 10))
      .lte("day", previousTo.toISOString().slice(0, 10)),
    supabase
      .from("seo_pages")
      .select(
        "id,url,canonical_url,title,meta_description,h1,page_type,indexable,last_inspected_at",
      )
      .eq("client_id", clientId),
    supabase
      .from("business_services")
      .select("name")
      .eq("client_id", clientId)
      .eq("status", "active"),
    supabase.from("seo_tasks").select("title,status,target_url").eq("client_id", clientId),
    supabase.from("analytics_daily").select("day,users,sessions,page_views,is_demo").eq("client_id",clientId).gte("day",period.from).lte("day",period.to),
    supabase.from("analytics_page_daily").select("day,page_path,users,sessions,page_views").eq("client_id",clientId).gte("day",period.from).lte("day",period.to),
    supabase.from("leads").select("id,source_url,status,created_at").eq("client_id",clientId).gte("created_at",`${period.from}T00:00:00Z`).lte("created_at",`${period.to}T23:59:59Z`),
    supabase.from("content_items").select("topic,target_keyword,status").eq("client_id",clientId).eq("content_kind","blog"),
  ]);
  for (const result of [
    currentResult,
    previousResult,
    pagesResult,
    servicesResult,
    previousTasksResult,
    analyticsResult,
    pageAnalyticsResult,
    leadsResult,
    blogsResult,
  ])
    if (result.error) throw result.error;
  const current = currentResult.data ?? [],
    previous = previousResult.data ?? [],
    pages = pagesResult.data ?? [],
    services = (servicesResult.data ?? []).map((row: any) => String(row.name)),
    opportunities = identifySeoOpportunities({
      current,
      previous,
      pages,
      services,
      previousTitles: (previousTasksResult.data ?? []).map((row: any) =>
        String(row.title ?? ""),
      ),
    });
  const currentMetrics = aggregate(current),
    clicks = currentMetrics.reduce((sum, row) => sum + row.clicks, 0),
    impressions = currentMetrics.reduce((sum, row) => sum + row.impressions, 0),
    weighted = currentMetrics.reduce(
      (sum, row) => sum + row.position * row.impressions,
      0,
    ),
    analytics=(analyticsResult.data??[]).reduce((totals:{users:number;sessions:number;pageViews:number},row:any)=>({users:totals.users+number(row.users),sessions:totals.sessions+number(row.sessions),pageViews:totals.pageViews+number(row.page_views)}),{users:0,sessions:0,pageViews:0}),
    leadCount=(leadsResult.data??[]).length,
    implementedWork=(previousTasksResult.data??[]).filter((row:any)=>["implemented","verified","complete"].includes(String(row.status))).length,
    summary = opportunities.length
      ? `${opportunities.filter((item) => item.priority === "high").length} high-priority and ${opportunities.filter((item) => item.priority === "medium").length} medium-priority SEO opportunities were identified from Search Console, website inventory, GA4, leads, content history and active services.`
      : "Available evidence did not support a new SEO recommendation for this period.";
  const { data: review, error: reviewError } = await supabase
    .from("seo_reviews")
    .insert({
      client_id: clientId,
      period_start: period.from,
      period_end: period.to,
      comparison_start: previousFrom.toISOString().slice(0, 10),
      comparison_end: previousTo.toISOString().slice(0, 10),
      summary,
      metrics: {
        clicks,
        impressions,
        ctr: impressions ? clicks / impressions : 0,
        averagePosition: impressions ? weighted / impressions : null,
        queries: currentMetrics.length,
        users:analytics.users,
        sessions:analytics.sessions,
        pageViews:analytics.pageViews,
        topPages:(pageAnalyticsResult.data??[]).sort((a:any,b:any)=>number(b.page_views)-number(a.page_views)).slice(0,10),
        leads:leadCount,
        priorBlogs:(blogsResult.data??[]).length,
        implementedWork,
      },
      data_freshness: {
        searchConsole:
          current
            .map((row: any) => row.day)
            .sort()
            .at(-1) ?? null,
        websiteInventory:
          pages
            .map((row: any) => row.last_inspected_at)
            .filter(Boolean)
            .sort()
            .at(-1) ?? null,
        analytics:(analyticsResult.data??[]).map((row:any)=>row.day).sort().at(-1)??null,
        leads:leadCount?period.to:null,
      },
      provider: "growth1000-evidence-engine",
      model: "rules-v1",
      estimated_cost: 0,
      duration_ms: Date.now() - started,
      created_by: userId,
    })
    .select("id")
    .single();
  if (reviewError) throw reviewError;
  if (opportunities.length) {
    const { error } = await supabase
      .from("seo_tasks")
      .insert(
        opportunities.map((item) => ({
          client_id: clientId,
          review_id: review.id,
          title: item.title,
          target_url: item.targetUrl,
          opportunity: item.observed,
          opportunity_type: item.opportunityType,
          affected_query: item.query,
          impact: item.priority,
          status: "suggested",
          notes: item.recommendation,
          recommendation: item.recommendation,
          expected_impact: item.expectedImpact,
          confidence: item.confidence,
          evidence: item.evidence,
        })),
      );
    if (error) throw error;
  }
  return {
    reviewId: String(review.id),
    summary,
    metrics: {
      clicks,
      impressions,
      ctr: impressions ? clicks / impressions : 0,
      averagePosition: impressions ? weighted / impressions : null,
    },
    opportunities,
  };
}
