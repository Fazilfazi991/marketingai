import "server-only";
import {isDemoMode} from "@/lib/demo-mode";
import {createClient} from "@/lib/supabase/server";
import type {SocialPost,SocialStatus} from "@/lib/social-store";

export type AdminSocialData={posts:SocialPost[];clients:Array<{id:string;name:string}>;isDemo:boolean};
const labels:Record<string,SocialStatus>={idea:"Idea",generating:"Generating",needs_review:"Needs review",approved:"Approved",ready_to_post:"Ready to schedule",scheduled:"Scheduled",published:"Published",issue:"Issue"};
const colors=["coral","sage","sand","blue"];

export async function loadAdminSocial():Promise<AdminSocialData>{
  if(isDemoMode())return{posts:[],clients:[{id:"30000000-0000-4000-8000-000000000001",name:"ABC Interiors"}],isDemo:true};
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Sign in as a partner.");
  const[{data:clients,error:clientError},{data:rows,error:contentError}]=await Promise.all([
    supabase.from("clients").select("id,name").is("deleted_at",null).order("name"),
    supabase.from("content_items").select("id,client_id,month,platform,content_kind,topic,concept,caption,hashtags,creative_brief,recommended_publish_at,internal_notes,staff_note,status,clients(name)").eq("content_kind","social_post").order("recommended_publish_at",{ascending:false}).limit(300),
  ]);if(clientError)throw clientError;if(contentError)throw contentError;
  const posts=(rows??[]).map((row,index):SocialPost=>{const relation=row.clients as unknown as {name?:string}|{name?:string}[]|null,client=Array.isArray(relation)?relation[0]?.name:relation?.name,date=row.recommended_publish_at?new Date(row.recommended_publish_at):null;return{
    id:String(row.id),clientId:String(row.client_id),client:client??"Client",month:new Intl.DateTimeFormat("en",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${row.month}T00:00:00Z`)),date:date?new Intl.DateTimeFormat("en",{day:"2-digit",month:"short",timeZone:"Asia/Dubai"}).format(date):"Date pending",time:date?new Intl.DateTimeFormat("en",{hour:"numeric",minute:"2-digit",timeZone:"Asia/Dubai"}).format(date):"Time pending",platform:row.platform||"Instagram",contentType:"Social post",topic:row.topic||"Untitled social post",concept:row.concept||"",caption:row.caption||"",hashtags:row.hashtags||"",creativeBrief:row.creative_brief||"",notes:row.internal_notes||"",issueNote:row.staff_note||"",status:labels[row.status]??"Idea",color:colors[index%colors.length],history:["Loaded from Growth1000 content records"],imagePrompt:row.creative_brief||"",imageModel:"Not generated",imageVersion:1,imageStatus:"Placeholder",storagePath:null,
  }});return{posts,clients:(clients??[]).map(client=>({id:String(client.id),name:String(client.name)})),isDemo:false};
}
