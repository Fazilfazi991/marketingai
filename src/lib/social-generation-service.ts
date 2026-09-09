import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { createAIProvider, type GenerationContext } from "@/lib/ai/provider";
import { prepareMonthlySocial } from "@/lib/ai/monthly-social";

const list = (value: string | null | undefined) =>
  value?.split(/\r?\n|,/).map((item) => item.trim()).filter(Boolean) ?? [];

export const normalizeSuggestedTime = (value: string | null | undefined) => {
  const text = value?.trim() || "11:00";
  const twelveHour = text.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
  if (twelveHour) {
    let hour = Number(twelveHour[1]) % 12;
    if (twelveHour[3].toUpperCase() === "PM") hour += 12;
    return `${String(hour).padStart(2, "0")}:${twelveHour[2] ?? "00"}`;
  }
  const twentyFourHour = text.match(/^([01]?\d|2[0-3])(?::([0-5]\d))?/);
  return twentyFourHour
    ? `${String(Number(twentyFourHour[1])).padStart(2, "0")}:${twentyFourHour[2] ?? "00"}`
    : "11:00";
};

export async function generateMonthlySocialContent(
  supabase: SupabaseClient,
  runId: string,
  clientId: string,
  month: string,
  runtimeOidcToken?: string | null,
) {
  const [clientResult, profileResult, servicesResult, locationsResult, faqsResult, recentResult, scopeResult, analyticsResult, searchResult, leadsResult] = await Promise.all([
    supabase.from("clients").select("name,industry,city,country").eq("id", clientId).is("deleted_at", null).single(),
    supabase.from("business_profiles").select("description,target_customers,value_proposition,tone_of_voice,business_hours,offers,important_claims,prohibited_claims").eq("client_id", clientId).maybeSingle(),
    supabase.from("business_services").select("name").eq("client_id", clientId).eq("status", "active"),
    supabase.from("business_locations").select("name").eq("client_id", clientId).eq("status", "active"),
    supabase.from("business_faqs").select("question,answer").eq("client_id", clientId).eq("verified", true),
    supabase.from("content_items").select("topic").eq("client_id", clientId).eq("content_kind", "social_post").order("created_at", { ascending: false }).limit(50),
    supabase.from("client_service_scopes").select("monthly_quantity").eq("client_id", clientId).eq("service_key", "social_media").eq("enabled", true).maybeSingle(),
    supabase.from("analytics_daily").select("day,metrics").eq("client_id", clientId).order("day", { ascending: false }).limit(90),
    supabase.from("search_console_daily").select("day,query,page,metrics").eq("client_id", clientId).order("day", { ascending: false }).limit(100),
    supabase.from("leads").select("source,lead_quality,created_at").eq("client_id", clientId).order("created_at", { ascending: false }).limit(200),
  ]);
  const sourceError = [clientResult.error, profileResult.error, servicesResult.error, locationsResult.error, faqsResult.error, recentResult.error, scopeResult.error, analyticsResult.error, searchResult.error, leadsResult.error].find(Boolean);
  if (sourceError) throw sourceError;
  const client = clientResult.data;
  if (!client) throw new Error("Client not found");
  const profile = profileResult.data, locations = locationsResult.data;
  const context: GenerationContext = {
    clientId,
    businessKnowledge: JSON.stringify({ client, profile, locations, faqs: faqsResult.data }),
    services: (servicesResult.data ?? []).map((item) => String(item.name)),
    offers: list(profile?.offers),
    prohibitedClaims: list(profile?.prohibited_claims),
    toneOfVoice: profile?.tone_of_voice ?? undefined,
    locations: (locations ?? []).map((item) => String(item.name)),
    recentContent: (recentResult.data ?? []).map((item) => item.topic).filter(Boolean) as string[],
    performanceContext: JSON.stringify({ analytics: analyticsResult.data, searchConsole: searchResult.data, leads: leadsResult.data }),
  };
  const plan = await prepareMonthlySocial(createAIProvider(process.env, runtimeOidcToken), month, Number(scopeResult.data?.monthly_quantity ?? 12), context);
  const { error: strategyError } = await supabase.from("social_monthly_strategies").upsert({
    client_id: clientId, month: `${month}-01`, monthly_objective: plan.strategy.monthlyObjective,
    priority_topics: plan.strategy.priorityTopics, primary_cta: plan.strategy.primaryCta,
    content_themes: plan.strategy.contentThemes, content_mix: plan.strategy.contentMix,
    performance_observations: plan.strategy.performanceObservations, avoid_repeating: plan.strategy.avoidRepeating,
    prompt_version: plan.promptVersions.strategy, provider: plan.provider, model: plan.model,
    generation_status: "complete", input_tokens: plan.usage.inputTokens,
    output_tokens: plan.usage.outputTokens, estimated_cost: plan.usage.estimatedCost,
    automation_run_id: runId,
  }, { onConflict: "client_id,month" });
  if (strategyError) throw strategyError;
  const items = plan.concepts.map((item) => ({ ...item, publish_at: `${item.suggestedDate}T${normalizeSuggestedTime(item.suggestedTime)}:00+04:00` }));
  const { data: count, error } = await supabase.rpc("complete_monthly_social_run", {
    target_run: runId, generated_items: items, provider_name: plan.provider,
    model_name: plan.model, estimated_cost: plan.usage.estimatedCost,
  });
  if (error) throw error;
  return { count: Number(count ?? items.length), plan };
}
