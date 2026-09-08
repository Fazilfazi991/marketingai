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
const leadSources = new Set(["website_form", "website_chatbot", "whatsapp", "manual", "instagram", "facebook", "google_business", "phone", "other"]);
const leadStatuses = new Set(["new", "contacted", "qualified", "won", "lost", "spam"]);
const leadQualities = new Set(["unqualified", "qualified", "high_intent", "disqualified"]);
const lifecycleStatuses = new Set(["onboarding", "active", "paused"]);
const healthStatuses = new Set(["healthy", "needs_attention", "at_risk"]);

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
    const { supabase, user, organizationId } = await adminContext();
    const { data: client, error } = await supabase.from("clients").insert({ organization_id: organizationId, name, slug, industry: String(formData.get("industry") ?? "").trim() || null, city: String(formData.get("location") ?? "").trim() || null, lifecycle_status: "onboarding", health_status: "healthy" }).select("id").single();
    if (error) return { ok: false, error: error.code === "23505" ? "A client with this name already exists." : error.message };
    const scopes = serviceDefinitions.filter(([key]) => formData.get(key) === "on").map(([service_key, label]) => ({ client_id: client.id, service_key, label, enabled: true, monthly_quantity: service_key === "social_media" ? 12 : service_key === "blogs" ? 2 : 1 }));
    let createdScopes: Array<{ id: string; service_key: string; label: string; monthly_quantity: number | null }> = [];
    if (scopes.length) {
      const { data, error: scopeError } = await supabase.from("client_service_scopes").insert(scopes).select("id,service_key,label,monthly_quantity");
      if (scopeError) { await supabase.from("clients").delete().eq("id", client.id); return { ok: false, error: scopeError.message }; }
      createdScopes = (data ?? []) as typeof createdScopes;
    }
    const accessRows = ["website", "google_analytics", "search_console", "instagram", "facebook", "whatsapp"].map(access_type => ({ client_id: client.id, access_type, status: "not_connected" }));
    const { error: accessError } = await supabase.from("client_access").insert(accessRows);
    if (accessError) { await supabase.from("clients").delete().eq("id", client.id); return { ok: false, error: accessError.message }; }
    if (createdScopes.length) {
      const month = `${new Date().toISOString().slice(0, 7)}-01`;
      const { data: period, error: periodError } = await supabase.from("delivery_periods").insert({ client_id: client.id, month, generated_by: user.id }).select("id").single();
      if (periodError) { await supabase.from("clients").delete().eq("id", client.id); return { ok: false, error: periodError.message }; }
      const obligations = createdScopes.map(scope => ({ delivery_period_id: period.id, client_service_scope_id: scope.id, deliverable_type: scope.service_key, label: scope.label, promised_quantity: Math.max(1, Number(scope.monthly_quantity ?? 1)) }));
      const { error: obligationError } = await supabase.from("delivery_obligations").insert(obligations);
      if (obligationError) { await supabase.from("clients").delete().eq("id", client.id); return { ok: false, error: obligationError.message }; }
    }
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

export async function saveClientDetails(slug:string,values:{name:string;industry:string;city:string;country:string;lifecycle:string;health:string}):Promise<MutationResult>{
  try{const name=values.name.trim(),lifecycle=values.lifecycle.toLowerCase().replaceAll(" ","_"),health=values.health.toLowerCase().replaceAll(" ","_");if(!name)return{ok:false,error:"Business name is required."};if(!lifecycleStatuses.has(lifecycle)||!healthStatuses.has(health))return{ok:false,error:"Invalid client status."};const{supabase,clientId}=await adminContext(slug);const{error}=await supabase.from("clients").update({name,industry:values.industry.trim()||null,city:values.city.trim()||null,country:values.country.trim()||"UAE",lifecycle_status:lifecycle,health_status:health,updated_at:new Date().toISOString()}).eq("id",clientId);if(error)return{ok:false,error:error.message};revalidatePath("/admin/clients");revalidatePath(`/admin/clients/${slug}`);return{ok:true}}catch(error){return{ok:false,error:error instanceof Error?error.message:"Unable to update client."}}
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

export async function generateDeliveryPeriod(slug: string, month: string): Promise<MutationResult> {
  try {
    if (!/^\d{4}-\d{2}$/.test(month)) return { ok: false, error: "Choose a valid delivery month." };
    const { supabase, user, clientId } = await adminContext(slug), monthStart = `${month}-01`;
    const { data: period, error: periodError } = await supabase.from("delivery_periods").upsert({ client_id: clientId, month: monthStart, generated_by: user.id, generated_at: new Date().toISOString() }, { onConflict: "client_id,month" }).select("id").single();
    if (periodError) return { ok: false, error: periodError.message };
    const { data: scopes, error: scopeError } = await supabase.from("client_service_scopes").select("id,service_key,label,monthly_quantity").eq("client_id", clientId).eq("enabled", true);
    if (scopeError) return { ok: false, error: scopeError.message };
    if (!(scopes ?? []).length) return { ok: false, error: "Enable at least one service before generating obligations." };
    const rows = (scopes ?? []).map(scope => ({ delivery_period_id: period.id, client_service_scope_id: scope.id, deliverable_type: scope.service_key, label: scope.label, promised_quantity: Math.max(1, Number(scope.monthly_quantity ?? 1)) }));
    const { error } = await supabase.from("delivery_obligations").upsert(rows, { onConflict: "delivery_period_id,client_service_scope_id", ignoreDuplicates: true });
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/clients/${slug}`);
    return { ok: true };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Unable to generate monthly obligations." }; }
}

export async function createLead(slug: string, formData: FormData): Promise<MutationResult & { id?: string }> {
  try {
    const { supabase, clientId } = await adminContext(slug);
    const source = String(formData.get("source") ?? "manual"), quality = String(formData.get("quality") ?? "unqualified"), status = "new";
    if (!leadSources.has(source) || !leadQualities.has(quality)) return { ok: false, error: "Invalid lead classification." };
    const name = String(formData.get("name") ?? "").trim(), phone = String(formData.get("phone") ?? "").trim(), email = String(formData.get("email") ?? "").trim();
    if (!name && !phone && !email) return { ok: false, error: "Add a name, phone number or email address." };
    const { data, error } = await supabase.from("leads").insert({ client_id: clientId, source, name: name || null, phone: phone || null, email: email || null, service: String(formData.get("service") ?? "").trim() || null, qualification_summary: String(formData.get("qualification") ?? "").trim() || null, lead_quality: quality, status }).select("id").single();
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/clients/${slug}/leads`);
    return { ok: true, id: String(data.id) };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Unable to create lead." }; }
}

export async function updateLeadStatus(slug: string, leadId: string, status: string): Promise<MutationResult> {
  try {
    if (!leadStatuses.has(status)) return { ok: false, error: "Invalid lead status." };
    const { supabase, clientId } = await adminContext(slug);
    const { error } = await supabase.from("leads").update({ status, updated_at: new Date().toISOString() }).eq("id", leadId).eq("client_id", clientId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(`/admin/clients/${slug}/leads`);
    return { ok: true };
  } catch (error) { return { ok: false, error: error instanceof Error ? error.message : "Unable to update lead." }; }
}
