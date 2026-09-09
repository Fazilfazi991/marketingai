"use server";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { generateMonthlySocialContent } from "@/lib/social-generation-service";
import { createAIProvider } from "@/lib/ai/provider";
import { generateImage, imageProviderConfig } from "@/lib/ai/image-provider";
import type { SocialPost } from "@/lib/social-store";
type Result = { ok: true } | { ok: false; error: string };
async function contextFor(clientId: string) {
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
    .select("id,name,industry,city")
    .eq("id", clientId)
    .eq("organization_id", membership.organization_id)
    .is("deleted_at", null)
    .single();
  if (!client) throw new Error("Client not found.");
  return {
    supabase,
    user,
    client,
    organizationId: String(membership.organization_id),
  };
}
export async function saveSocialContent(
  post: SocialPost,
  status: string,
): Promise<Result> {
  if (
    typeof post.id !== "string" ||
    !/^[0-9a-f-]{36}$/i.test(post.id) ||
    !post.clientId
  )
    return { ok: false, error: "Invalid content item." };
  try {
    const { supabase, client } = await contextFor(post.clientId);
    const allowed = new Set([
      "idea",
      "generating",
      "needs_review",
      "approved",
      "ready_for_design",
      "poster_created",
      "ready_to_schedule",
      "ready_to_post",
      "scheduled",
      "published",
      "issue",
    ]);
    if (!allowed.has(status))
      return { ok: false, error: "Invalid content status." };
    const { error } = await supabase
      .from("content_items")
      .update({
        topic: post.topic,
        objective: post.objective,
        poster_headline: post.posterHeadline,
        poster_supporting_text: post.posterSupportingText,
        concept: post.concept,
        caption: post.caption,
        hashtags: post.hashtags,
        creative_brief: post.creativeBrief,
        image_prompt: post.imagePrompt,
        cta: post.cta,
        internal_notes: post.notes,
        status,
      })
      .eq("id", post.id)
      .eq("client_id", client.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/admin/content");
    revalidatePath("/staff");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to save social content.",
    };
  }
}
export async function regenerateSocialText(contentId:string,clientId:string,mode:"brief"|"caption"|"poster_prompt"):Promise<{ok:true;patch:Partial<SocialPost>}|{ok:false;error:string}>{
 if(!/^[0-9a-f-]{36}$/i.test(contentId)||!new Set(["brief","caption","poster_prompt"]).has(mode))return{ok:false,error:"Invalid regeneration request."};
 try{const{supabase,client}=await contextFor(clientId);const{data:item,error}=await supabase.from("content_items").select("concept,caption,creative_brief,image_prompt").eq("id",contentId).eq("client_id",client.id).eq("content_kind","social_post").maybeSingle();if(error)throw error;if(!item)return{ok:false,error:"Social content not found."};
 const{data:profile}=await supabase.from("business_profiles").select("description,tone_of_voice,offers,prohibited_claims").eq("client_id",client.id).maybeSingle();const{data:services}=await supabase.from("business_services").select("name").eq("client_id",client.id).eq("status","active");const context={clientId,businessKnowledge:JSON.stringify({client,profile}),services:(services??[]).map(row=>String(row.name)),offers:String(profile?.offers??"").split(/\r?\n|,/).filter(Boolean),prohibitedClaims:String(profile?.prohibited_claims??"").split(/\r?\n|,/).filter(Boolean)};
 const provider=createAIProvider();let patch:Partial<SocialPost>;if(mode==="caption"){const generated=await provider.generateCaption(context,item.concept??"");patch={caption:generated.data};await supabase.from("content_items").update({caption:generated.data,caption_prompt_version:"caption_v1",generation_provider:generated.provider,generation_model:generated.model}).eq("id",contentId)}else{const generated=await provider.generateCreativeBrief(context,item.concept??"");patch=mode==="poster_prompt"?{imagePrompt:generated.data}:{creativeBrief:generated.data};await supabase.from("content_items").update(mode==="poster_prompt"?{image_prompt:generated.data,poster_prompt_version:"poster_prompt_v1",generation_provider:generated.provider,generation_model:generated.model}:{creative_brief:generated.data,prompt_version:"post_brief_v1",generation_provider:generated.provider,generation_model:generated.model}).eq("id",contentId)}revalidatePath("/admin/content");return{ok:true,patch};
 }catch(error){return{ok:false,error:error instanceof Error?error.message:"Unable to regenerate content."}}
}
export async function regenerateSocialCreative(
  contentId: string,
  clientId: string,
): Promise<
  | {
      ok: true;
      image: {
        version: number;
        status: SocialPost["imageStatus"];
        model: string;
        storagePath: string | null;
        url: string | null;
      };
    }
  | { ok: false; error: string }
> {
  if (!/^[0-9a-f-]{36}$/i.test(contentId))
    return { ok: false, error: "Invalid social content." };
  try {
    const { supabase, user, client } = await contextFor(clientId);
    const { data: content, error: contentError } = await supabase
      .from("content_items")
      .select("id,creative_brief")
      .eq("id", contentId)
      .eq("client_id", client.id)
      .eq("content_kind", "social_post")
      .maybeSingle();
    if (contentError) return { ok: false, error: contentError.message };
    if (!content) return { ok: false, error: "Social content not found." };
    const config = imageProviderConfig();
    const { data, error } = await supabase.rpc("regenerate_social_image", {
      target_content: contentId,
      requested_model: config?.model ?? "placeholder",
    });
    if (error) return { ok: false, error: error.message };
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) return { ok: false, error: "Image version was not created." };
    const version = Number(row.image_version),
      model = String(row.image_model);
    if (!config) {
      revalidatePath("/admin/content");
      return {
        ok: true,
        image: {
          version,
          status: "Placeholder",
          model,
          storagePath: null,
          url: null,
        },
      };
    }
    const { data: generation, error: generationError } = await supabase
      .from("image_generations")
      .select("id")
      .eq("content_item_id", contentId)
      .eq("version", version)
      .single();
    if (generationError) return { ok: false, error: generationError.message };
    const { error: startError } = await supabase
      .from("image_generations")
      .update({ status: "generating", error_message: null })
      .eq("id", generation.id);
    if (startError) return { ok: false, error: startError.message };
    let storagePath: string | null = null,
      assetId: string | null = null;
    try {
      const image = await generateImage(content.creative_brief ?? "", config);
      storagePath = `${client.id}/generated-images/${contentId}/v${version}.${image.extension}`;
      const uploaded = await supabase.storage
        .from("client-assets")
        .upload(storagePath, image.bytes, {
          contentType: image.mimeType,
          cacheControl: "31536000",
          upsert: false,
        });
      if (uploaded.error) throw uploaded.error;
      const { data: asset, error: assetError } = await supabase
        .from("assets")
        .insert({
          client_id: client.id,
          filename: `social-${contentId}-v${version}.${image.extension}`,
          mime_type: image.mimeType,
          category: "Generated Images",
          storage_path: storagePath,
          source: "generated",
          created_by: user.id,
        })
        .select("id")
        .single();
      if (assetError) throw assetError;
      assetId = String(asset.id);
      const { error: linkError } = await supabase
        .from("content_assets")
        .insert({
          content_item_id: contentId,
          asset_id: asset.id,
          prompt: content.creative_brief,
          model: image.model,
          version,
          generation_status: "generated",
        });
      if (linkError) throw linkError;
      const { error: updateError } = await supabase
        .from("image_generations")
        .update({
          status: "generated",
          model: image.model,
          storage_path: storagePath,
          error_message: null,
        })
        .eq("id", generation.id);
      if (updateError) throw updateError;
      const signed = await supabase.storage
        .from("client-assets")
        .createSignedUrl(storagePath, 900);
      revalidatePath("/admin/content");
      revalidatePath("/admin/assets");
      revalidatePath("/staff");
      return {
        ok: true,
        image: {
          version,
          status: "Generated",
          model: image.model,
          storagePath,
          url: signed.data?.signedUrl ?? null,
        },
      };
    } catch (generationFailure) {
      if (assetId) await supabase.from("assets").delete().eq("id", assetId);
      if (storagePath)
        await supabase.storage.from("client-assets").remove([storagePath]);
      const message =
        generationFailure instanceof Error
          ? generationFailure.message
          : "Image generation failed.";
      await supabase
        .from("image_generations")
        .update({
          status: "failed",
          storage_path: null,
          error_message: message.slice(0, 1000),
        })
        .eq("id", generation.id);
      return { ok: false, error: message };
    }
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "Unable to regenerate image.",
    };
  }
}
export async function generateSocialMonth(
  clientId: string,
  month: string,
): Promise<Result> {
  if (!/^\d{4}-\d{2}$/.test(month))
    return { ok: false, error: "Choose a valid month." };
  try {
    const { supabase, client, organizationId } = await contextFor(clientId),
      monthStart = `${month}-01`;
    const { count, error: countError } = await supabase
      .from("content_items")
      .select("id", { count: "exact", head: true })
      .eq("client_id", clientId)
      .eq("content_kind", "social_post")
      .eq("month", monthStart);
    if (countError) return { ok: false, error: countError.message };
    if (count)
      return {
        ok: false,
        error:
          "This month already has social content. Review existing items instead of replacing them.",
      };
    const { data: job, error: jobError } = await supabase
      .from("automation_jobs")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("workflow_key", "MONTHLY_SOCIAL")
      .eq("status", "active")
      .maybeSingle();
    if (jobError) return { ok: false, error: jobError.message };
    if (!job)
      return { ok: false, error: "Monthly social automation is not active." };
    const { data: run, error: runError } = await supabase
      .from("automation_runs")
      .insert({
        job_id: job.id,
        client_id: client.id,
        status: "queued",
        input_reference: { month },
        metadata: { trigger: "content_workspace" },
      })
      .select("id")
      .single();
    if (runError) return { ok: false, error: runError.message };
    try {
      const { error: startError } = await supabase
        .from("automation_runs")
        .update({ status: "running" })
        .eq("id", run.id)
        .eq("status", "queued");
      if (startError) throw startError;
      const requestHeaders = await headers();
      await generateMonthlySocialContent(supabase, String(run.id), String(client.id), month, requestHeaders.get("x-vercel-oidc-token"));
    } catch (error) {
      const message = error instanceof Error
        ? error.message
        : error && typeof error === "object" && "message" in error && typeof error.message === "string"
          ? error.message
          : "Monthly social preparation failed";
      console.error("MONTHLY_SOCIAL_FAILED", message);
      const { data: failed } = await supabase
        .from("automation_runs")
        .update({ status: "failed", finished_at: new Date().toISOString() })
        .eq("id", run.id)
        .in("status", ["queued", "running"])
        .select("id");
      if (failed?.length)
        await supabase
          .from("automation_errors")
          .insert({
            run_id: run.id,
            error_code: "MONTHLY_SOCIAL_FAILED",
            message,
            details: { retryable: true },
          });
      return {
        ok: false,
        error:
          "Monthly social preparation could not be completed. Review Integration Health and retry.",
      };
    }
    revalidatePath("/admin/content");
    revalidatePath("/admin/automations");
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Unable to prepare the social month.",
    };
  }
}
