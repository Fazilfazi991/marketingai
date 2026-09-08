"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type MutationResult = { ok: true; slug?: string } | { ok: false; error: string };
const serviceDefinitions = [
  ["seo", "SEO"], ["social_media", "Social media posts"], ["blogs", "SEO blogs"],
  ["website_maintenance", "Website maintenance"], ["website_chatbot", "Website AI chatbot"],
  ["whatsapp_ai", "WhatsApp AI"], ["analytics_reporting", "Analytics and reporting"],
] as const;
const slugify = (value: string) => value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

async function adminContext(slug?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in as a partner.");
  const { data: membership, error } = await supabase.from("organization_members").select("organization_id").eq("user_id", user.id).eq("role", "admin").eq("status", "active").limit(1).maybeSingle();
  if (error || !membership) throw new Error("An active partner membership is required.");
  if (!slug) return { supabase, user, organizationId: membership.organization_id as string, clientId: "" };
  const { data: client, error: clientError } = await supabase.from("clients").select("id").eq("organization_id", membership.organization_id).eq("slug", slug).is("deleted_at", null).single();
  if (clientError || !client) throw new Error("Client not found.");
  return { supabase, user, organizationId: membership.organization_id as string, clientId: client.id as string };
}

export async function createGrowthClient(formData: FormData): Promise<MutationResult> {
  try {
    const name = String(formData.get("name") ?? "").trim();
    const slug = slugify(name);
    if (!name || !slug) return { ok: false, error: "Business name is required." };
    const { supabase, organizationId } = await adminContext();
    const { data: client, error } = await supabase.from("clients").insert({ organization_id: organizationId, name, slug, industry: String(formData.get("industry") ?? "").trim() || null, city: String(formData.get("location") ?? "").trim() || null, lifecycle_status: "onboarding", health_status: "healthy" }).select("id").single();
    if (error) return { ok: false, error: error.code === "23505" ? "A client with this name already exists." : error.message };
    const scopes = serviceDefinitions.filter(([key]) => formData.get(key) === "on").map(([service_key, label]) => ({ client_id: client.id, service_key, label, enabled: true, monthly_quantity: service_key === "social_media" ? 12 : service_key === "blogs" ? 2 : 1 }));
    if (scopes.length) {
      const { error: scopeError } = await supabase.from("client_service_scopes").insert(scopes);
      if (scopeError) { await supabase.from("clients").delete().eq("id", client.id); return { ok: false, error: scopeError.message }; }
    }
    const accessRows = ["website", "google_analytics", "search_console", "instagram", "facebook", "whatsapp"].map(access_type => ({ client_id: client.id, access_type, status: "not_connected" }));
    const { error: accessError } = await supabase.from("client_access").insert(accessRows);
    if (accessError) { await supabase.from("clients").delete().eq("id", client.id); return { ok: false, error: accessError.message }; }
    revalidatePath("/admin/clients");
    return { ok: true, slug };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Unable to create client." }; }
}

export async function saveBusinessKnowledge(slug: string, values: Record<string, string>): Promise<MutationResult> {
  try {
    const { supabase, clientId } = await adminContext(slug);
    const { error } = await supabase.from("business_profiles").upsert({ client_id: clientId, description: values.description, target_customers: values.customers, value_proposition: values.value, tone_of_voice: values.tone, website: values.website, prohibited_claims: values.claims, updated_at: new Date().toISOString() });
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/clients/${slug}/business`);
    return { ok: true };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Unable to save business knowledge." }; }
}

export async function saveClientAccess(slug: string, accessType: string, status: string): Promise<MutationResult> {
  try {
    const { supabase, user, clientId } = await adminContext(slug);
    const normalized = accessType.toLowerCase().replaceAll(" ", "_");
    const { error } = await supabase.from("client_access").upsert({ client_id: clientId, access_type: normalized, status: status.toLowerCase().replaceAll(" ", "_"), verified_at: new Date().toISOString(), verified_by: user.id }, { onConflict: "client_id,access_type" });
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/clients/${slug}/access`);
    return { ok: true };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Unable to update access." }; }
}

export async function saveServiceScope(slug: string, scope: Array<{ key: string; label: string; enabled: boolean; quantity: number }>): Promise<MutationResult> {
  try {
    const { supabase, clientId } = await adminContext(slug);
    const allowed = new Set(serviceDefinitions.map(([key]) => key));
    const rows = scope.filter(item => allowed.has(item.key as typeof serviceDefinitions[number][0])).map(item => ({ client_id: clientId, service_key: item.key, label: item.label, enabled: item.enabled, monthly_quantity: Math.max(1, Math.round(item.quantity)) }));
    const { error } = await supabase.from("client_service_scopes").upsert(rows, { onConflict: "client_id,service_key" });
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/clients/${slug}/scope`);
    return { ok: true };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Unable to save service scope." }; }
}
