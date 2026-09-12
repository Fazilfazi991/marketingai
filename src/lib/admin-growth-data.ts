import "server-only";
import { isDemoMode } from "@/lib/demo-mode";
import { createClient } from "@/lib/supabase/server";

export type GrowthClient = { id: string; name: string };
export type AdminBlog = {
  id: string;
  clientId: string;
  client: string;
  title: string;
  keyword: string;
  intent: string;
  brief: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  status: string;
  updated: string;
  slug: string;
  canonicalUrl: string;
  internalLinks: string;
  featuredImagePrompt: string;
  structuredData: string;
  implementationPackage: string;
};
export type AdminKeyword = {
  id: string;
  clientId: string;
  client: string;
  keyword: string;
  intent: string;
  url: string;
  current: number | null;
  previous: number | null;
  priority: string;
  status: string;
  notes: string;
};
export type AdminOpportunity = {
  id: string;
  clientId: string;
  client: string;
  title: string;
  page: string;
  impact: string;
  status: string;
  detail: string;
  type: string;
  query: string;
  evidence: string;
  recommendation: string;
  confidence: string;
  internalNotes: string;
};
export type SeoSnapshot = {
  clientId: string;
  pages: number;
  indexable: number;
  issues: number;
  lastInventory: string;
  lastReview: string;
  reviewStatus: string;
};
export type AdminGrowthData = {
  clients: GrowthClient[];
  blogs: AdminBlog[];
  keywords: AdminKeyword[];
  opportunities: AdminOpportunity[];
  snapshots: SeoSnapshot[];
  isDemo: boolean;
};
const titleCase = (v: string) =>
  v.replaceAll("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
const formatDate = (v: string | null | undefined) =>
  v
    ? new Intl.DateTimeFormat("en-AE", {
        day: "numeric",
        month: "short",
        timeZone: "Asia/Dubai",
      }).format(new Date(v))
    : "Never";
const demoData: AdminGrowthData = {
  clients: [{ id: "demo-abc", name: "ABC Interiors" }],
  blogs: [
    {
      id: "demo-blog-1",
      clientId: "demo-abc",
      client: "ABC Interiors",
      title: "The complete guide to villa renovation in Dubai",
      keyword: "villa renovation dubai",
      intent: "Commercial",
      brief:
        "Evidence-backed guide based on the villa renovation service page.",
      excerpt:
        "Renovating a villa is easier when decisions happen in the right order.",
      metaTitle: "Villa Renovation Dubai: A Practical Guide",
      metaDescription:
        "Plan a Dubai villa renovation with a clear guide to scope and delivery.",
      status: "Needs Review",
      updated: "Today",
      slug: "villa-renovation-dubai-guide",
      canonicalUrl: "https://example.com/villa-renovation-dubai-guide",
      internalLinks: "/villa-renovation — primary service CTA",
      featuredImagePrompt:
        "Editorial photograph of a refined Dubai villa interior",
      structuredData: "Article",
      implementationPackage: "Ready after human approval.",
    },
  ],
  keywords: [
    {
      id: "demo-keyword-1",
      clientId: "demo-abc",
      client: "ABC Interiors",
      keyword: "kitchen renovation dubai",
      intent: "Commercial",
      url: "/kitchen-renovation",
      current: 8,
      previous: 11,
      priority: "High",
      status: "Improving",
      notes: "Strengthen service proof.",
    },
  ],
  opportunities: [
    {
      id: "demo-opportunity-1",
      clientId: "demo-abc",
      client: "ABC Interiors",
      title: "Publish villa renovation planning guide",
      page: "/villa-renovation",
      impact: "High",
      status: "Suggested",
      detail: "Support the service page with a useful guide.",
      type: "Content Gap",
      query: "villa renovation dubai",
      evidence: "GSC position 14 with verified service page.",
      recommendation: "Create a planning guide linked to the service page.",
      confidence: "High",
      internalNotes: "",
    },
  ],
  snapshots: [
    {
      clientId: "demo-abc",
      pages: 12,
      indexable: 11,
      issues: 2,
      lastInventory: "Today",
      lastReview: "Today",
      reviewStatus: "Completed",
    },
  ],
  isDemo: true,
};

export async function loadAdminGrowth(): Promise<AdminGrowthData> {
  if (isDemoMode()) return demoData;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in as a partner.");
  const [cr, br, kr, or, pr, ir, rr] = await Promise.all([
    supabase
      .from("clients")
      .select("id,name")
      .is("deleted_at", null)
      .order("name"),
    supabase
      .from("content_items")
      .select(
        "id,client_id,topic,target_keyword,concept,body,seo_metadata,status,updated_at,slug,research_brief,internal_links,implementation_package,canonical_recommendation,featured_image_prompt,structured_data_recommendation,clients(name)",
      )
      .eq("content_kind", "blog")
      .order("updated_at", { ascending: false }),
    supabase
      .from("seo_keywords")
      .select(
        "id,client_id,keyword,intent,target_url,current_position,previous_position,priority,status,notes,clients(name)",
      )
      .order("updated_at", { ascending: false }),
    supabase
      .from("seo_tasks")
      .select(
        "id,client_id,title,target_url,impact,status,notes,opportunity,opportunity_type,affected_query,evidence,recommendation,confidence,internal_notes,clients(name)",
      )
      .order("updated_at", { ascending: false }),
    supabase.from("seo_pages").select("client_id,indexable,status_code"),
    supabase
      .from("website_inventory_runs")
      .select("client_id,status,finished_at")
      .order("started_at", { ascending: false }),
    supabase
      .from("seo_reviews")
      .select("client_id,created_at")
      .order("created_at", { ascending: false }),
  ]);
  for (const r of [cr, br, kr, or, pr, ir, rr]) if (r.error) throw r.error;
  const nameOf = (x: unknown) => {
    const v = x as { name?: string } | { name?: string }[] | null;
    return (Array.isArray(v) ? v[0]?.name : v?.name) ?? "Client";
  };
  const clients = (cr.data ?? []).map((x) => ({
    id: String(x.id),
    name: String(x.name),
  }));
  const blogs = (br.data ?? []).map((x) => {
    const m = (x.seo_metadata ?? {}) as Record<string, unknown>;
    return {
      id: String(x.id),
      clientId: String(x.client_id),
      client: nameOf(x.clients),
      title: x.topic ?? "Untitled article",
      keyword: x.target_keyword ?? "",
      intent: String(m.intent ?? "Commercial"),
      brief: JSON.stringify(x.research_brief ?? x.concept ?? "", null, 2),
      excerpt: x.body ?? "",
      metaTitle: String(m.title ?? x.topic ?? ""),
      metaDescription: String(m.description ?? ""),
      status: titleCase(x.status),
      updated: formatDate(x.updated_at),
      slug: x.slug ?? "",
      canonicalUrl: x.canonical_recommendation ?? "",
      internalLinks: JSON.stringify(x.internal_links ?? [], null, 2),
      featuredImagePrompt: x.featured_image_prompt ?? "",
      structuredData: x.structured_data_recommendation ?? "",
      implementationPackage: JSON.stringify(
        x.implementation_package ?? {},
        null,
        2,
      ),
    };
  });
  const keywords = (kr.data ?? []).map((x) => ({
    id: String(x.id),
    clientId: String(x.client_id),
    client: nameOf(x.clients),
    keyword: x.keyword,
    intent: x.intent ?? "",
    url: x.target_url ?? "",
    current: x.current_position,
    previous: x.previous_position,
    priority: titleCase(x.priority ?? "medium"),
    status: titleCase(x.status ?? "tracking"),
    notes: x.notes ?? "",
  }));
  const opportunities = (or.data ?? []).map((x) => ({
    id: String(x.id),
    clientId: String(x.client_id),
    client: nameOf(x.clients),
    title: x.title ?? x.opportunity ?? "SEO opportunity",
    page: x.target_url ?? "",
    impact: titleCase(x.impact ?? "medium"),
    status: titleCase(x.status ?? "suggested"),
    detail: x.notes ?? x.opportunity ?? "",
    type: titleCase(x.opportunity_type ?? "general"),
    query: x.affected_query ?? "",
    evidence: JSON.stringify(x.evidence ?? {}, null, 2),
    recommendation: x.recommendation ?? "",
    confidence: titleCase(x.confidence ?? "medium"),
    internalNotes: x.internal_notes ?? "",
  }));
  const snapshots = clients.map((c) => {
    const pages = (pr.data ?? []).filter((x) => x.client_id === c.id),
      inventory = (ir.data ?? []).find((x) => x.client_id === c.id),
      review = (rr.data ?? []).find((x) => x.client_id === c.id);
    return {
      clientId: c.id,
      pages: pages.length,
      indexable: pages.filter((x) => x.indexable).length,
      issues: pages.filter((x) => !x.indexable || Number(x.status_code) >= 400)
        .length,
      lastInventory: formatDate(inventory?.finished_at),
      lastReview: formatDate(review?.created_at),
      reviewStatus: review ? "Completed" : "Not Run",
    };
  });
  return { clients, blogs, keywords, opportunities, snapshots, isDemo: false };
}
