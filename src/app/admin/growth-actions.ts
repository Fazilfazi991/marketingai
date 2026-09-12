"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import type { AdminBlog } from "@/lib/admin-growth-data";
import type { GenerationContext } from "@/lib/ai/provider";
import { createAIProvider } from "@/lib/ai/provider";
import { DemoAIProvider } from "@/lib/ai/demo-provider";
import { isDemoMode } from "@/lib/demo-mode";
import { refreshWebsiteInventory as refreshInventory } from "@/lib/website-inventory";
import { runSeoIntelligence } from "@/lib/seo-intelligence-service";
import { runBlogFactory as generateBlogs } from "@/lib/blog-factory-service";
type Result =
  | { ok: true; id?: string; message?: string }
  | { ok: false; error: string };
type GeneratedBlogResult =
  | {
      ok: true;
      article: Pick<
        AdminBlog,
        "brief" | "excerpt" | "metaTitle" | "metaDescription" | "status"
      >;
      provider: string;
      model: string;
    }
  | { ok: false; error: string };
const blogStatuses = new Set([
    "recommended",
    "research_ready",
    "research",
    "topic_selected",
    "brief",
    "draft",
    "needs_review",
    "internal_review",
    "approved",
    "ready_for_codex",
    "ready_to_publish",
    "published",
    "rejected",
    "issue",
  ]),
  opportunityStatuses = new Set([
    "suggested",
    "reviewed",
    "approved",
    "ready_for_codex",
    "implemented",
    "verified",
    "rejected",
    "issue",
  ]),
  priorities = new Set(["low", "medium", "high"]),
  list = (value: string | null | undefined) =>
    value
      ?.split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean) ?? [],
  json = (value: string, fallback: unknown) => {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  };
async function adminContext(clientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in as a partner.");
  const { data: membership } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (!membership) throw new Error("An active partner membership is required.");
  const { data: client } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .eq("organization_id", membership.organization_id)
    .is("deleted_at", null)
    .maybeSingle();
  if (!client) throw new Error("Client not found.");
  return { supabase, clientId: String(client.id) };
}
export async function createBlog(formData: FormData): Promise<Result> {
  try {
    const clientId = String(formData.get("clientId") ?? ""),
      title = String(formData.get("title") ?? "").trim(),
      keyword = String(formData.get("keyword") ?? "").trim();
    if (!title || !keyword)
      return { ok: false, error: "Title and target keyword are required." };
    const { supabase } = await adminContext(clientId);
    const { data, error } = await supabase
      .from("content_items")
      .insert({
        client_id: clientId,
        content_kind: "blog",
        topic: title,
        target_keyword: keyword,
        concept: String(formData.get("brief") ?? "").trim(),
        seo_metadata: {
          intent: String(formData.get("intent") ?? "Commercial"),
        },
        status: "research",
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/blogs");
    return { ok: true, id: String(data.id) };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to create the article.",
    };
  }
}
export async function saveBlog(item: AdminBlog): Promise<Result> {
  const status = item.status.toLowerCase().replaceAll(" ", "_");
  if (!blogStatuses.has(status))
    return { ok: false, error: "Invalid blog status." };
  try {
    const { supabase } = await adminContext(item.clientId),
      internalLinks = json(item.internalLinks, []),
      researchBrief = json(item.brief, { notes: item.brief }),
      implementation = json(item.implementationPackage, {});
    const { error } = await supabase
      .from("content_items")
      .update({
        topic: item.title,
        target_keyword: item.keyword,
        concept: item.brief,
        body: item.excerpt,
        seo_metadata: {
          intent: item.intent,
          title: item.metaTitle,
          description: item.metaDescription,
        },
        slug: item.slug || null,
        canonical_recommendation: item.canonicalUrl || null,
        featured_image_prompt: item.featuredImagePrompt || null,
        structured_data_recommendation: item.structuredData || null,
        internal_links: internalLinks,
        research_brief: researchBrief,
        implementation_package: {
          ...(typeof implementation === "object" && implementation
            ? implementation
            : {}),
          slug: item.slug,
          metadata: {
            title: item.metaTitle,
            description: item.metaDescription,
          },
          internalLinks,
          imagePrompt: item.featuredImagePrompt,
          boundary:
            status === "ready_for_codex" ? "ready_for_codex" : "admin_review",
        },
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", item.id)
      .eq("client_id", item.clientId)
      .eq("content_kind", "blog");
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/blogs");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to save the article.",
    };
  }
}
export async function generateBlogDraft(
  item: Pick<
    AdminBlog,
    "id" | "clientId" | "title" | "keyword" | "intent" | "brief"
  >,
): Promise<GeneratedBlogResult> {
  if (!item.title.trim() || !item.keyword.trim())
    return {
      ok: false,
      error: "Add a title and target keyword before generating.",
    };
  try {
    let context: GenerationContext, provider;
    if (isDemoMode()) {
      provider = new DemoAIProvider();
      context = {
        clientId: item.clientId,
        businessKnowledge:
          "ABC Interiors is a Dubai interior design and renovation studio serving Dubai and Sharjah.",
        services: [
          "Kitchen Renovation",
          "Villa Renovation",
          "Wardrobes",
          "Interior Fit-out",
        ],
        offers: [],
        prohibitedClaims: [
          "Unverified prices",
          "Guarantees",
          "Certifications",
          "Testimonials",
          "Statistics",
        ],
      };
    } else {
      const { supabase } = await adminContext(item.clientId);
      const [
        clientResult,
        profileResult,
        servicesResult,
        locationsResult,
        faqsResult,
      ] = await Promise.all([
        supabase
          .from("clients")
          .select("name,industry,city,country")
          .eq("id", item.clientId)
          .single(),
        supabase
          .from("business_profiles")
          .select(
            "description,target_customers,value_proposition,tone_of_voice,business_hours,offers,important_claims,prohibited_claims",
          )
          .eq("client_id", item.clientId)
          .maybeSingle(),
        supabase
          .from("business_services")
          .select("name")
          .eq("client_id", item.clientId)
          .eq("status", "active"),
        supabase
          .from("business_locations")
          .select("name")
          .eq("client_id", item.clientId)
          .eq("status", "active"),
        supabase
          .from("business_faqs")
          .select("question,answer")
          .eq("client_id", item.clientId)
          .eq("verified", true),
      ]);
      const sourceError = [
        clientResult.error,
        profileResult.error,
        servicesResult.error,
        locationsResult.error,
        faqsResult.error,
      ].find(Boolean);
      if (sourceError) throw sourceError;
      const profile = profileResult.data;
      context = {
        clientId: item.clientId,
        businessKnowledge: JSON.stringify({
          client: clientResult.data,
          profile,
          locations: locationsResult.data,
          verifiedFaqs: faqsResult.data,
          article: { title: item.title, intent: item.intent },
        }),
        services: (servicesResult.data ?? []).map((service) => service.name),
        offers: list(profile?.offers),
        prohibitedClaims: list(profile?.prohibited_claims),
      };
      provider = createAIProvider();
    }
    const briefResult = await provider.generateBlogBrief(
        context,
        `${item.keyword}. Working title: ${item.title}. Existing research: ${item.brief || "none"}`,
      ),
      draftResult = await provider.generateBlogDraft(context, briefResult.data);
    const metaTitle = item.title.slice(0, 60),
      plain = draftResult.data
        .replace(/[#*_`]/g, "")
        .replace(/\s+/g, " ")
        .trim(),
      metaDescription =
        plain
          .slice(0, 155)
          .replace(/\s+\S*$/, "")
          .trim() + (plain.length > 155 ? "…" : ""),
      article = {
        brief: briefResult.data,
        excerpt: draftResult.data,
        metaTitle,
        metaDescription,
        status: "Draft" as const,
      };
    if (!isDemoMode()) {
      const { supabase } = await adminContext(item.clientId);
      const { error } = await supabase
        .from("content_items")
        .update({
          concept: article.brief,
          body: article.excerpt,
          seo_metadata: {
            intent: item.intent,
            title: article.metaTitle,
            description: article.metaDescription,
          },
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id)
        .eq("client_id", item.clientId)
        .eq("content_kind", "blog");
      if (error) throw error;
    }
    revalidatePath("/admin/blogs");
    return {
      ok: true,
      article,
      provider: draftResult.provider,
      model: draftResult.model,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to generate the article draft.",
    };
  }
}
export async function createKeyword(formData: FormData): Promise<Result> {
  try {
    const clientId = String(formData.get("clientId") ?? ""),
      priority = String(formData.get("priority") ?? "medium").toLowerCase();
    if (!priorities.has(priority))
      return { ok: false, error: "Invalid priority." };
    const { supabase } = await adminContext(clientId);
    const { data, error } = await supabase
      .from("seo_keywords")
      .insert({
        client_id: clientId,
        keyword: String(formData.get("keyword") ?? "").trim(),
        intent: String(formData.get("intent") ?? ""),
        target_url: String(formData.get("url") ?? "").trim(),
        current_position: Number(formData.get("current")) || null,
        previous_position: Number(formData.get("current")) || null,
        priority,
        status: "tracking",
        notes: String(formData.get("notes") ?? "").trim() || null,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/seo");
    return { ok: true, id: String(data.id) };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to add the keyword.",
    };
  }
}
export async function updateOpportunity(
  id: string,
  clientId: string,
  status: string,
): Promise<Result> {
  const normalized = status.toLowerCase().replaceAll(" ", "_");
  if (!opportunityStatuses.has(normalized))
    return { ok: false, error: "Invalid SEO status." };
  try {
    const { supabase } = await adminContext(clientId);
    const { error } = await supabase
      .from("seo_tasks")
      .update({ status: normalized, updated_at: new Date().toISOString() })
      .eq("id", id)
      .eq("client_id", clientId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/seo");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to update the opportunity.",
    };
  }
}

export async function refreshWebsiteInventory(
  clientId: string,
): Promise<Result> {
  try {
    const { supabase, clientId: scopedClient } = await adminContext(clientId),
      {
        data: { user },
      } = await supabase.auth.getUser();
    const [
      { data: profile, error: profileError },
      { data: scope, error: scopeError },
    ] = await Promise.all([
      supabase
        .from("business_profiles")
        .select("website")
        .eq("client_id", scopedClient)
        .maybeSingle(),
      supabase
        .from("client_service_scopes")
        .select("enabled")
        .eq("client_id", scopedClient)
        .eq("service_key", "seo")
        .maybeSingle(),
    ]);
    if (profileError || scopeError) throw profileError ?? scopeError;
    if (!scope?.enabled)
      return {
        ok: false,
        error: "SEO is not enabled in this client's service scope.",
      };
    if (!profile?.website)
      return {
        ok: false,
        error: "Add the client's public website in Business Knowledge first.",
      };
    const result = await refreshInventory(
      supabase,
      scopedClient,
      String(profile.website),
      String(user!.id),
    );
    revalidatePath("/admin/seo");
    revalidatePath("/admin/clients");
    return {
      ok: true,
      message: `Inspected ${result.pages.length} public pages.`,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to refresh website inventory.",
    };
  }
}

export async function runSeoReview(clientId: string): Promise<Result> {
  try {
    const { supabase, clientId: scopedClient } = await adminContext(clientId),
      {
        data: { user },
      } = await supabase.auth.getUser(),
      to = new Date();
    to.setUTCDate(to.getUTCDate() - 1);
    const from = new Date(to);
    from.setUTCDate(from.getUTCDate() - 27);
    const result = await runSeoIntelligence(
      supabase,
      scopedClient,
      {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
      },
      String(user!.id),
    );
    revalidatePath("/admin/seo");
    revalidatePath("/admin/clients");
    return {
      ok: true,
      message: `${result.opportunities.length} evidence-backed opportunities prepared.`,
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to run the SEO review.",
    };
  }
}

export async function runBlogFactory(
  clientId: string,
  month: string,
): Promise<Result> {
  if (!/^\d{4}-\d{2}$/.test(month))
    return { ok: false, error: "Choose a valid month." };
  try {
    const { supabase, clientId: scopedClient } = await adminContext(clientId),
      {
        data: { user },
      } = await supabase.auth.getUser(),
      requestHeaders = await headers(),
      provider = createAIProvider(
        process.env,
        requestHeaders.get("x-vercel-oidc-token"),
      );
    const result = await generateBlogs(
      supabase,
      provider,
      scopedClient,
      month,
      String(user!.id),
    );
    revalidatePath("/admin/blogs");
    revalidatePath("/admin/automations");
    return {
      ok: true,
      message: `Generated ${result.count} evidence-backed drafts for review.`,
    };
  } catch (error) {
    console.error(
      "BLOG_FACTORY_FAILED",
      error instanceof Error ? error.message : "Unknown error",
    );
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to generate blog drafts.",
    };
  }
}

export async function createOpportunityTask(
  id: string,
  clientId: string,
): Promise<Result> {
  try {
    const { supabase } = await adminContext(clientId);
    const { data: item, error } = await supabase
      .from("seo_tasks")
      .select("title,recommendation,target_url")
      .eq("id", id)
      .eq("client_id", clientId)
      .maybeSingle();
    if (error) throw error;
    if (!item) return { ok: false, error: "SEO opportunity not found." };
    const { data: task, error: taskError } = await supabase
      .from("tasks")
      .insert({
        client_id: clientId,
        title: item.title,
        description: [item.recommendation, item.target_url]
          .filter(Boolean)
          .join("\n"),
        category: "seo",
        status: "not_started",
        priority: "high",
      })
      .select("id")
      .single();
    if (taskError) throw taskError;
    await supabase
      .from("seo_tasks")
      .update({
        task_id: task.id,
        status: "ready_for_codex",
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("client_id", clientId);
    revalidatePath("/admin/seo");
    revalidatePath("/admin/tasks");
    return {
      ok: true,
      id: String(task.id),
      message: "Implementation task created.",
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to create the implementation task.",
    };
  }
}
