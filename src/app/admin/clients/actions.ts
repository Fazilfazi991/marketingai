"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import {
  parseKnowledgeFaqs,
  parseKnowledgeList,
} from "@/lib/business-knowledge";
import { createHash, randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";

export type MutationResult =
  | { ok: true; slug?: string }
  | { ok: false; error: string };
const serviceDefinitions = [
  ["seo", "SEO"],
  ["social_media", "Social media posts"],
  ["blogs", "SEO blogs"],
  ["website_maintenance", "Website maintenance"],
  ["website_chatbot", "Website AI chatbot"],
  ["whatsapp_ai", "WhatsApp AI"],
  ["analytics_reporting", "Analytics and reporting"],
] as const;
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
const leadSources = new Set([
  "website_form",
  "website_chatbot",
  "whatsapp",
  "manual",
  "instagram",
  "facebook",
  "google_business",
  "phone",
  "other",
]);
const leadStatuses = new Set([
  "new",
  "qualified",
  "general",
  "contacted",
  "won",
  "lost",
  "spam",
]);
const leadQualities = new Set([
  "unqualified",
  "qualified",
  "high_intent",
  "disqualified",
]);
const lifecycleStatuses = new Set([
  "onboarding",
  "active",
  "paused",
  "needs_attention",
  "archived",
]);
const healthStatuses = new Set(["healthy", "needs_attention", "at_risk"]);
const accessStatuses = new Set([
  "connected",
  "pending",
  "not_required",
  "issue",
]);

async function adminContext(slug?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in as a partner.");
  const { data: membership, error } = await supabase
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", user.id)
    .eq("role", "admin")
    .eq("status", "active")
    .limit(1)
    .maybeSingle();
  if (error || !membership)
    throw new Error("An active partner membership is required.");
  if (!slug)
    return {
      supabase,
      user,
      organizationId: membership.organization_id as string,
      clientId: "",
    };
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("organization_id", membership.organization_id)
    .eq("slug", slug)
    .is("deleted_at", null)
    .single();
  if (clientError || !client) throw new Error("Client not found.");
  return {
    supabase,
    user,
    organizationId: membership.organization_id as string,
    clientId: client.id as string,
  };
}

export async function createGrowthClient(
  formData: FormData,
): Promise<MutationResult> {
  try {
    const name = String(formData.get("name") ?? "").trim();
    const slug = slugify(name);
    if (!name || !slug)
      return { ok: false, error: "Business name is required." };
    const { supabase, user, organizationId } = await adminContext();
    const lifecycle = String(formData.get("lifecycle") ?? "onboarding")
      .toLowerCase()
      .replaceAll(" ", "_");
    if (!lifecycleStatuses.has(lifecycle))
      return { ok: false, error: "Invalid lifecycle status." };
    const email = String(formData.get("email") ?? "").trim();
    if (email && !/^\S+@\S+\.\S+$/.test(email))
      return { ok: false, error: "Enter a valid contact email." };
    const website = String(formData.get("website") ?? "").trim();
    if (website) {
      try {
        new URL(website);
      } catch {
        return {
          ok: false,
          error: "Enter a valid website URL including https://.",
        };
      }
    }
    const startDate = String(
      formData.get("start_date") ?? new Date().toISOString().slice(0, 10),
    );
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate))
      return { ok: false, error: "Choose a valid start date." };
    const location = String(formData.get("location") ?? "").trim();
    const { data: client, error } = await supabase
      .from("clients")
      .insert({
        organization_id: organizationId,
        name,
        slug,
        industry: String(formData.get("industry") ?? "").trim() || null,
        city: location || null,
        emirate: location || null,
        contact_name: String(formData.get("contact_name") ?? "").trim() || null,
        contact_email: email || null,
        contact_phone: String(formData.get("phone") ?? "").trim() || null,
        contact_whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
        website_url: website || null,
        start_date: startDate,
        lifecycle_status: lifecycle,
        health_status:
          lifecycle === "needs_attention" ? "needs_attention" : "healthy",
        is_demo: false,
      })
      .select("id")
      .single();
    if (error)
      return {
        ok: false,
        error:
          error.code === "23505"
            ? "A client with this name already exists."
            : error.message,
      };
    const scopes = serviceDefinitions
      .filter(([key]) => formData.get(key) === "on")
      .map(([service_key, label]) => ({
        client_id: client.id,
        service_key,
        label,
        enabled: true,
        monthly_quantity:
          service_key === "social_media" ? 12 : service_key === "blogs" ? 2 : 1,
      }));
    let createdScopes: Array<{
      id: string;
      service_key: string;
      label: string;
      monthly_quantity: number | null;
    }> = [];
    if (scopes.length) {
      const { data, error: scopeError } = await supabase
        .from("client_service_scopes")
        .insert(scopes)
        .select("id,service_key,label,monthly_quantity");
      if (scopeError) {
        await supabase.from("clients").delete().eq("id", client.id);
        return { ok: false, error: scopeError.message };
      }
      createdScopes = (data ?? []) as typeof createdScopes;
    }
    const accessRows = [
      "website",
      "github",
      "vercel",
      "wordpress",
      "hosting",
      "domain",
      "google_analytics",
      "search_console",
      "google_business_profile",
      "facebook",
      "instagram",
      "whatsapp",
    ].map((access_type) => ({
      client_id: client.id,
      access_type,
      status: "pending",
    }));
    const { error: accessError } = await supabase
      .from("client_access")
      .insert(accessRows);
    if (accessError) {
      await supabase.from("clients").delete().eq("id", client.id);
      return { ok: false, error: accessError.message };
    }
    const { error: profileError } = await supabase
      .from("business_profiles")
      .insert({
        client_id: client.id,
        description: String(formData.get("description") ?? "").trim() || null,
        email: email || null,
        phone: String(formData.get("phone") ?? "").trim() || null,
        whatsapp: String(formData.get("whatsapp") ?? "").trim() || null,
        website: website || null,
      });
    if (profileError) {
      await supabase.from("clients").delete().eq("id", client.id);
      return { ok: false, error: profileError.message };
    }
    if (createdScopes.length) {
      const month = `${new Date().toISOString().slice(0, 7)}-01`;
      const { data: period, error: periodError } = await supabase
        .from("delivery_periods")
        .insert({ client_id: client.id, month, generated_by: user.id })
        .select("id")
        .single();
      if (periodError) {
        await supabase.from("clients").delete().eq("id", client.id);
        return { ok: false, error: periodError.message };
      }
      const obligations = createdScopes.map((scope) => ({
        delivery_period_id: period.id,
        client_service_scope_id: scope.id,
        deliverable_type: scope.service_key,
        label: scope.label,
        promised_quantity: Math.max(1, Number(scope.monthly_quantity ?? 1)),
      }));
      const { error: obligationError } = await supabase
        .from("delivery_obligations")
        .insert(obligations);
      if (obligationError) {
        await supabase.from("clients").delete().eq("id", client.id);
        return { ok: false, error: obligationError.message };
      }
    }
    revalidatePath("/admin/clients");
    return { ok: true, slug };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to create client.",
    };
  }
}

export async function saveGoogleIntegrations(
  slug: string,
  values: {
    ga4PropertyId: string;
    searchConsoleSiteUrl: string;
    ga4Status: string;
    searchStatus: string;
  },
): Promise<MutationResult> {
  try {
    const { supabase, clientId } = await adminContext(slug);
    const status = (value: string) =>
      value === "connected" ? "connected" : "not_connected";
    if (values.ga4PropertyId && !/^\d+$/.test(values.ga4PropertyId.trim()))
      return { ok: false, error: "GA4 property ID must be numeric." };
    if (
      values.searchConsoleSiteUrl &&
      !/^(sc-domain:|https?:\/\/)/.test(values.searchConsoleSiteUrl.trim())
    )
      return { ok: false, error: "Enter a valid Search Console property." };
    const rows = [
      {
        client_id: clientId,
        provider: "google_analytics",
        status: status(values.ga4Status),
        external_reference: values.ga4PropertyId.trim() || null,
        configuration: { propertyId: values.ga4PropertyId.trim() },
        is_demo: false,
      },
      {
        client_id: clientId,
        provider: "search_console",
        status: status(values.searchStatus),
        external_reference: values.searchConsoleSiteUrl.trim() || null,
        configuration: { siteUrl: values.searchConsoleSiteUrl.trim() },
        is_demo: false,
      },
    ];
    const { error } = await supabase
      .from("client_integrations")
      .upsert(rows, { onConflict: "client_id,provider" });
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/clients/${slug}/access`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to save Google integrations.",
    };
  }
}

export async function createClientSite(
  slug: string,
  origin: string,
): Promise<MutationResult & { siteIdentifier?: string; siteKey?: string }> {
  try {
    const { supabase, clientId } = await adminContext(slug);
    let normalized = "";
    if (origin.trim()) {
      try {
        normalized = new URL(origin).origin;
      } catch {
        return { ok: false, error: "Enter a valid website origin." };
      }
    }
    const siteIdentifier = `g1_${randomBytes(9).toString("base64url")}`,
      siteKey = randomBytes(32).toString("base64url"),
      secretHash = createHash("sha256").update(siteKey).digest("hex");
    const { error } = await supabase
      .from("client_sites")
      .insert({
        client_id: clientId,
        site_identifier: siteIdentifier,
        origin: normalized || null,
        secret_hash: secretHash,
      });
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/clients/${slug}/access`);
    return { ok: true, siteIdentifier, siteKey };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to create site integration.",
    };
  }
}

export async function inviteClientUser(
  slug: string,
  email: string,
  fullName: string,
): Promise<MutationResult> {
  try {
    const { clientId } = await adminContext(slug);
    const normalized = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(normalized))
      return { ok: false, error: "Enter a valid email." };
    const admin = createAdminClient();
    const { data: existing } = await admin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    let user = existing.users.find(
      (item) => item.email?.toLowerCase() === normalized,
    );
    if (!user) {
      const { data, error } = await admin.auth.admin.inviteUserByEmail(
        normalized,
        { data: { full_name: fullName.trim() || normalized.split("@")[0] } },
      );
      if (error) return { ok: false, error: error.message };
      user = data.user;
    }
    if (!user) return { ok: false, error: "Unable to provision user." };
    const { data: internalMembership } = await admin
      .from("organization_members")
      .select("user_id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();
    if (internalMembership)
      return {
        ok: false,
        error: "Internal staff accounts cannot be linked as client users.",
      };
    const { error: profileError } = await admin
      .from("profiles")
      .upsert(
        { id: user.id, full_name: fullName.trim() || normalized.split("@")[0] },
        { onConflict: "id" },
      );
    if (profileError) return { ok: false, error: profileError.message };
    const { data: other } = await admin
      .from("client_members")
      .select("client_id")
      .eq("user_id", user.id)
      .neq("client_id", clientId)
      .limit(1)
      .maybeSingle();
    if (other)
      return {
        ok: false,
        error: "This user is already linked to another client.",
      };
    const { error: memberError } = await admin
      .from("client_members")
      .upsert(
        { client_id: clientId, user_id: user.id, role: "client" },
        { onConflict: "client_id,user_id" },
      );
    if (memberError) return { ok: false, error: memberError.message };
    revalidatePath(`/admin/clients/${slug}/access`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to invite client user.",
    };
  }
}

export async function saveBusinessKnowledge(
  slug: string,
  values: Record<string, string>,
): Promise<MutationResult> {
  try {
    const { supabase, clientId } = await adminContext(slug);
    const faqs = parseKnowledgeFaqs(values.faqs);
    const { error } = await supabase
      .from("business_profiles")
      .upsert({
        client_id: clientId,
        description: values.description.trim() || null,
        target_customers: values.customers.trim() || null,
        value_proposition: values.value.trim() || null,
        tone_of_voice: values.tone.trim() || null,
        business_hours: values.businessHours.trim() || null,
        phone: values.phone.trim() || null,
        whatsapp: values.whatsapp.trim() || null,
        email: values.email.trim() || null,
        website: values.website.trim() || null,
        offers: values.offers.trim() || null,
        competitors: values.competitors.trim() || null,
        important_claims: values.importantClaims.trim() || null,
        prohibited_claims: values.claims.trim() || null,
        updated_at: new Date().toISOString(),
      });
    if (error) return { ok: false, error: error.message };
    const { error: clientError } = await supabase
      .from("clients")
      .update({
        industry: values.industry.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId);
    if (clientError) return { ok: false, error: clientError.message };
    for (const [table, requested] of [
      ["business_services", parseKnowledgeList(values.services)],
      ["business_locations", parseKnowledgeList(values.locations)],
    ] as const) {
      const { data: existing, error: readError } = await supabase
        .from(table)
        .select("id,name,status")
        .eq("client_id", clientId);
      if (readError) return { ok: false, error: readError.message };
      const desired = new Map(
        requested.map((name) => [name.toLocaleLowerCase(), name]),
      );
      const known = new Set(
        (existing ?? []).map((item) => String(item.name).toLocaleLowerCase()),
      );
      const activate = (existing ?? [])
        .filter(
          (item) =>
            desired.has(String(item.name).toLocaleLowerCase()) &&
            item.status !== "active",
        )
        .map((item) => item.id);
      const deactivate = (existing ?? [])
        .filter(
          (item) =>
            !desired.has(String(item.name).toLocaleLowerCase()) &&
            item.status === "active",
        )
        .map((item) => item.id);
      if (activate.length) {
        const { error: activateError } = await supabase
          .from(table)
          .update({ status: "active" })
          .in("id", activate);
        if (activateError) return { ok: false, error: activateError.message };
      }
      if (deactivate.length) {
        const { error: deactivateError } = await supabase
          .from(table)
          .update({ status: "inactive" })
          .in("id", deactivate);
        if (deactivateError)
          return { ok: false, error: deactivateError.message };
      }
      const additions = requested
        .filter((name) => !known.has(name.toLocaleLowerCase()))
        .map((name) => ({ client_id: clientId, name }));
      if (additions.length) {
        const { error: insertError } = await supabase
          .from(table)
          .insert(additions);
        if (insertError) return { ok: false, error: insertError.message };
      }
    }
    const { data: existingFaqs, error: faqReadError } = await supabase
      .from("business_faqs")
      .select("id,question,answer")
      .eq("client_id", clientId);
    if (faqReadError) return { ok: false, error: faqReadError.message };
    const desiredQuestions = new Set(
      faqs.map((item) => item.question.toLocaleLowerCase()),
    );
    for (const faq of faqs) {
      const existing = (existingFaqs ?? []).find(
        (item) =>
          String(item.question).toLocaleLowerCase() ===
          faq.question.toLocaleLowerCase(),
      );
      const response = existing
        ? await supabase
            .from("business_faqs")
            .update({
              question: faq.question,
              answer: faq.answer,
              verified: true,
            })
            .eq("id", existing.id)
        : await supabase
            .from("business_faqs")
            .insert({ client_id: clientId, ...faq, verified: true });
      if (response.error) return { ok: false, error: response.error.message };
    }
    const removedFaqs = (existingFaqs ?? [])
      .filter(
        (item) =>
          !desiredQuestions.has(String(item.question).toLocaleLowerCase()),
      )
      .map((item) => item.id);
    if (removedFaqs.length) {
      const { error: deleteError } = await supabase
        .from("business_faqs")
        .delete()
        .in("id", removedFaqs);
      if (deleteError) return { ok: false, error: deleteError.message };
    }
    revalidatePath(`/admin/clients/${slug}/business`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to save business knowledge.",
    };
  }
}

export async function saveClientDetails(
  slug: string,
  values: {
    name: string;
    industry: string;
    city: string;
    country: string;
    lifecycle: string;
    health: string;
  },
): Promise<MutationResult> {
  try {
    const name = values.name.trim(),
      lifecycle = values.lifecycle.toLowerCase().replaceAll(" ", "_"),
      health = values.health.toLowerCase().replaceAll(" ", "_");
    if (!name) return { ok: false, error: "Business name is required." };
    if (!lifecycleStatuses.has(lifecycle) || !healthStatuses.has(health))
      return { ok: false, error: "Invalid client status." };
    const { supabase, clientId } = await adminContext(slug);
    const { error } = await supabase
      .from("clients")
      .update({
        name,
        industry: values.industry.trim() || null,
        city: values.city.trim() || null,
        country: values.country.trim() || "UAE",
        lifecycle_status: lifecycle,
        health_status: health,
        updated_at: new Date().toISOString(),
      })
      .eq("id", clientId);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/clients");
    revalidatePath(`/admin/clients/${slug}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to update client.",
    };
  }
}

export async function saveClientAccess(
  slug: string,
  values: {
    name: string;
    status: string;
    platform: string;
    accountReference: string;
    notes: string;
  },
): Promise<MutationResult> {
  try {
    const { supabase, user, clientId } = await adminContext(slug);
    const normalized = values.name.toLowerCase().replaceAll(" ", "_"),
      status = values.status.toLowerCase().replaceAll(" ", "_");
    if (!accessStatuses.has(status))
      return { ok: false, error: "Invalid access status." };
    const verified = status === "connected" || status === "demo";
    const { error } = await supabase
      .from("client_access")
      .upsert(
        {
          client_id: clientId,
          access_type: normalized,
          platform: values.platform.trim() || values.name,
          status,
          account_reference: values.accountReference.trim() || null,
          notes: values.notes.trim() || null,
          verified_at: verified ? new Date().toISOString() : null,
          verified_by: verified ? user.id : null,
        },
        { onConflict: "client_id,access_type" },
      );
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/clients/${slug}/access`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to update access.",
    };
  }
}

export async function saveServiceScope(
  slug: string,
  scope: Array<{
    key: string;
    label: string;
    enabled: boolean;
    quantity: number;
  }>,
): Promise<MutationResult> {
  try {
    const { supabase, clientId } = await adminContext(slug);
    const allowed = new Set(serviceDefinitions.map(([key]) => key));
    const rows = scope
      .filter((item) =>
        allowed.has(item.key as (typeof serviceDefinitions)[number][0]),
      )
      .map((item) => ({
        client_id: clientId,
        service_key: item.key,
        label: item.label,
        enabled: item.enabled,
        monthly_quantity: Math.max(1, Math.round(item.quantity)),
      }));
    const { error } = await supabase
      .from("client_service_scopes")
      .upsert(rows, { onConflict: "client_id,service_key" });
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/clients/${slug}/scope`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to save service scope.",
    };
  }
}

export async function generateDeliveryPeriod(
  slug: string,
  month: string,
): Promise<MutationResult> {
  try {
    if (!/^\d{4}-\d{2}$/.test(month))
      return { ok: false, error: "Choose a valid delivery month." };
    const { supabase, user, clientId } = await adminContext(slug),
      monthStart = `${month}-01`;
    const { data: period, error: periodError } = await supabase
      .from("delivery_periods")
      .upsert(
        {
          client_id: clientId,
          month: monthStart,
          generated_by: user.id,
          generated_at: new Date().toISOString(),
        },
        { onConflict: "client_id,month" },
      )
      .select("id")
      .single();
    if (periodError) return { ok: false, error: periodError.message };
    const { data: scopes, error: scopeError } = await supabase
      .from("client_service_scopes")
      .select("id,service_key,label,monthly_quantity")
      .eq("client_id", clientId)
      .eq("enabled", true);
    if (scopeError) return { ok: false, error: scopeError.message };
    if (!(scopes ?? []).length)
      return {
        ok: false,
        error: "Enable at least one service before generating obligations.",
      };
    const rows = (scopes ?? []).map((scope) => ({
      delivery_period_id: period.id,
      client_service_scope_id: scope.id,
      deliverable_type: scope.service_key,
      label: scope.label,
      promised_quantity: Math.max(1, Number(scope.monthly_quantity ?? 1)),
    }));
    const { error } = await supabase
      .from("delivery_obligations")
      .upsert(rows, {
        onConflict: "delivery_period_id,client_service_scope_id",
        ignoreDuplicates: true,
      });
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/clients/${slug}`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to generate monthly obligations.",
    };
  }
}

export async function createLead(
  slug: string,
  formData: FormData,
): Promise<MutationResult & { id?: string }> {
  try {
    const { supabase, clientId } = await adminContext(slug);
    const source = String(formData.get("source") ?? "manual"),
      quality = String(formData.get("quality") ?? "unqualified"),
      status = "new";
    if (!leadSources.has(source) || !leadQualities.has(quality))
      return { ok: false, error: "Invalid lead classification." };
    const name = String(formData.get("name") ?? "").trim(),
      phone = String(formData.get("phone") ?? "").trim(),
      email = String(formData.get("email") ?? "").trim();
    if (!name && !phone && !email)
      return { ok: false, error: "Add a name, phone number or email address." };
    const { data, error } = await supabase
      .from("leads")
      .insert({
        client_id: clientId,
        source,
        name: name || null,
        phone: phone || null,
        email: email || null,
        service: String(formData.get("service") ?? "").trim() || null,
        qualification_summary:
          String(formData.get("qualification") ?? "").trim() || null,
        lead_quality: quality,
        status,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/clients/${slug}/leads`);
    return { ok: true, id: String(data.id) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to create lead.",
    };
  }
}

export async function updateLeadStatus(
  slug: string,
  leadId: string,
  status: string,
): Promise<MutationResult> {
  try {
    if (!leadStatuses.has(status))
      return { ok: false, error: "Invalid lead status." };
    const { supabase, clientId } = await adminContext(slug);
    const { error } = await supabase
      .from("leads")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", leadId)
      .eq("client_id", clientId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/clients/${slug}/leads`);
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Unable to update lead.",
    };
  }
}
