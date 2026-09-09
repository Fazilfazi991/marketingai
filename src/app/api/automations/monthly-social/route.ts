import { NextRequest } from "next/server";
import { createAIProvider } from "@/lib/ai/provider";
import { prepareMonthlySocial } from "@/lib/ai/monthly-social";
import type { GenerationContext } from "@/lib/ai/provider";
import { createAdminClient } from "@/lib/supabase/admin";
import { matchesWebhookSecret } from "@/lib/webhook-auth";

export const runtime = "nodejs";
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const json = (body: Record<string, unknown>, status: number) => Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
const list = (value: string | null | undefined) => value?.split(/\r?\n|,/).map(item => item.trim()).filter(Boolean) ?? [];

export async function POST(request: NextRequest) {
  if (!matchesWebhookSecret(request.headers.get("x-growth1000-key"), process.env.N8N_WEBHOOK_SECRET)) return json({ error: "Unauthorized" }, 401);
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const runId=String(body.run_id??""),clientId=String(body.client_id??""),month=String(body.month??"");
  if(!uuid.test(runId)||!uuid.test(clientId)||!/^\d{4}-\d{2}$/.test(month))return json({error:"run_id, client_id and month are required"},400);
  let supabase:ReturnType<typeof createAdminClient>;
  try{supabase=createAdminClient()}catch{return json({error:"Automation execution is not configured"},503)}
  const{data:run,error:runError}=await supabase.from("automation_runs").select("id,client_id,status,input_reference,automation_jobs(workflow_key)").eq("id",runId).eq("client_id",clientId).maybeSingle();
  const relation=run?.automation_jobs as unknown as {workflow_key?:string}|null,inputMonth=(run?.input_reference as Record<string,unknown>|null)?.month;
  if(runError)return json({error:"Unable to load automation run"},500);
  if(!run||relation?.workflow_key!=="MONTHLY_SOCIAL"||inputMonth!==month)return json({error:"Automation run does not match this request"},409);
  if(run.status==="succeeded")return json({run_id:runId,status:"succeeded",replayed:true},200);
  if(!["queued","running"].includes(run.status))return json({error:`Automation run is ${run.status}`},409);
  const{error:startError}=await supabase.from("automation_runs").update({status:"running"}).eq("id",runId).in("status",["queued","running"]);
  if(startError)return json({error:"Unable to start automation run"},500);
  try{
    const[clientResult,profileResult,servicesResult,locationsResult,faqsResult,recentResult,scopeResult,analyticsResult,searchResult,leadsResult]=await Promise.all([
      supabase.from("clients").select("name,industry,city,country").eq("id",clientId).is("deleted_at",null).single(),
      supabase.from("business_profiles").select("description,target_customers,value_proposition,tone_of_voice,business_hours,offers,important_claims,prohibited_claims").eq("client_id",clientId).maybeSingle(),
      supabase.from("business_services").select("name").eq("client_id",clientId).eq("status","active"),
      supabase.from("business_locations").select("name").eq("client_id",clientId).eq("status","active"),
      supabase.from("business_faqs").select("question,answer").eq("client_id",clientId).eq("verified",true),
      supabase.from("content_items").select("topic").eq("client_id",clientId).eq("content_kind","social_post").order("created_at",{ascending:false}).limit(50),
      supabase.from("client_service_scopes").select("monthly_quantity").eq("client_id",clientId).eq("service_key","social_media").eq("enabled",true).maybeSingle(),
      supabase.from("analytics_daily").select("day,metrics").eq("client_id",clientId).order("day",{ascending:false}).limit(90),
      supabase.from("search_console_daily").select("day,query,page,metrics").eq("client_id",clientId).order("day",{ascending:false}).limit(100),
      supabase.from("leads").select("source,lead_quality,created_at").eq("client_id",clientId).order("created_at",{ascending:false}).limit(200),
    ]);
    const sourceError=[clientResult.error,profileResult.error,servicesResult.error,locationsResult.error,faqsResult.error,recentResult.error,scopeResult.error,analyticsResult.error,searchResult.error,leadsResult.error].find(Boolean);
    if(sourceError)throw sourceError;
    const client=clientResult.data,profile=profileResult.data,services=servicesResult.data,locations=locationsResult.data,faqs=faqsResult.data,recent=recentResult.data,scope=scopeResult.data;
    if(!client)throw new Error("Client not found");
    const context:GenerationContext={clientId,businessKnowledge:JSON.stringify({client,profile,locations,faqs}),services:(services??[]).map(item=>item.name),offers:list(profile?.offers),prohibitedClaims:list(profile?.prohibited_claims),toneOfVoice:profile?.tone_of_voice??undefined,locations:(locations??[]).map(item=>item.name),recentContent:(recent??[]).map(item=>item.topic).filter(Boolean) as string[],performanceContext:JSON.stringify({analytics:analyticsResult.data,searchConsole:searchResult.data,leads:leadsResult.data})};
    const plan=await prepareMonthlySocial(createAIProvider(),month,Number(scope?.monthly_quantity??12),context);
    const{error:strategyError}=await supabase.from("social_monthly_strategies").upsert({client_id:clientId,month:`${month}-01`,monthly_objective:plan.strategy.monthlyObjective,priority_topics:plan.strategy.priorityTopics,primary_cta:plan.strategy.primaryCta,content_themes:plan.strategy.contentThemes,content_mix:plan.strategy.contentMix,performance_observations:plan.strategy.performanceObservations,avoid_repeating:plan.strategy.avoidRepeating,prompt_version:plan.promptVersions.strategy,provider:plan.provider,model:plan.model,generation_status:"complete",input_tokens:plan.usage.inputTokens,output_tokens:plan.usage.outputTokens,estimated_cost:plan.usage.estimatedCost,automation_run_id:runId},{onConflict:"client_id,month"});if(strategyError)throw strategyError;
    const items=plan.concepts.map(item=>({...item,publish_at:`${item.suggestedDate}T${item.suggestedTime||"11:00"}:00+04:00`}));
    const{data:count,error}=await supabase.rpc("complete_monthly_social_run",{target_run:runId,generated_items:items,provider_name:plan.provider,model_name:plan.model,estimated_cost:plan.usage.estimatedCost});
    if(error)throw error;
    return json({run_id:runId,status:"succeeded",content_records:count,boundary:"needs_review"},200);
  }catch(error){
    const message=error instanceof Error?error.message:"Monthly social preparation failed";
    await supabase.from("automation_runs").update({status:"failed",finished_at:new Date().toISOString(),output_reference:{}}).eq("id",runId);
    await supabase.from("automation_errors").insert({run_id:runId,error_code:"MONTHLY_SOCIAL_FAILED",message,details:{retryable:true}});
    return json({error:"Monthly social preparation failed",run_id:runId},500);
  }
}
