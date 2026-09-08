import "server-only";

import { posts } from "@/lib/demo-data";
import { isDemoMode } from "@/lib/demo-mode";
import { createClient } from "@/lib/supabase/server";

export type StaffQueueStatus = "Ready to schedule" | "Scheduled" | "Published" | "Issue";
export type StaffQueueItem = { id:string; client:string; month:string; date:string; time:string; platform:string; topic:string; caption:string; hashtags:string; issueNote:string; status:StaffQueueStatus; color:string; storagePath:string|null };
export type StaffQueueData = { items:StaffQueueItem[]; clients:string[]; periodLabel:string; isDemo:boolean };
const statusLabel:Record<string,StaffQueueStatus>={ready_to_post:"Ready to schedule",scheduled:"Scheduled",published:"Published",issue:"Issue"};
const palettes=["coral","sage","sand","blue"];

function formatSchedule(value:string|null){if(!value)return{month:"Unscheduled",date:"Date pending",time:"Time pending"};const date=new Date(value);return{month:new Intl.DateTimeFormat("en",{month:"long",year:"numeric",timeZone:"Asia/Dubai"}).format(date),date:new Intl.DateTimeFormat("en",{day:"2-digit",month:"short",timeZone:"Asia/Dubai"}).format(date),time:new Intl.DateTimeFormat("en",{hour:"numeric",minute:"2-digit",timeZone:"Asia/Dubai"}).format(date)}}
const demoItems:StaffQueueItem[]=posts.filter(post=>["Ready to schedule","Scheduled","Published","Issue"].includes(post.status)).map(post=>({id:String(post.id),client:"ABC Interiors",month:"November 2026",date:post.date,time:post.time,platform:post.platform,topic:post.topic,caption:post.caption,hashtags:"#DubaiInteriors #InteriorDesignUAE #HomeRenovation",issueNote:"",status:post.status as StaffQueueStatus,color:post.color,storagePath:null}));

export async function loadStaffQueue():Promise<StaffQueueData>{
  if(isDemoMode())return{items:demoItems,clients:["ABC Interiors"],periodLabel:"November 2026",isDemo:true};
  const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Sign in as a staff member.");
  const{data,error}=await supabase.from("content_items").select("id,platform,topic,caption,hashtags,recommended_publish_at,scheduled_at,published_at,staff_note,status,clients(name)").eq("content_kind","social_post").in("status",["ready_to_post","scheduled","published","issue"]).order("recommended_publish_at",{ascending:true});
  if(error)throw error;
  const ids=(data??[]).map(row=>String(row.id));const{data:links,error:linkError}=ids.length?await supabase.from("content_assets").select("content_item_id,assets(storage_path)").in("content_item_id",ids):{data:[],error:null};if(linkError)throw linkError;
  const paths=new Map((links??[]).map(link=>{const relation=link.assets as unknown as {storage_path?:string}|{storage_path?:string}[]|null;const asset=Array.isArray(relation)?relation[0]:relation;return[String(link.content_item_id),asset?.storage_path??null]}));
  const items=(data??[]).map((row,index):StaffQueueItem=>{const relation=row.clients as unknown as {name?:string}|{name?:string}[]|null;const client=Array.isArray(relation)?relation[0]?.name:relation?.name;return{id:String(row.id),client:client??"Client",...formatSchedule(row.published_at??row.scheduled_at??row.recommended_publish_at),platform:row.platform||"Platform pending",topic:row.topic||"Social post",caption:row.caption||"Caption pending",hashtags:row.hashtags||"",issueNote:row.staff_note||"",status:statusLabel[row.status]??"Ready to schedule",color:palettes[index%palettes.length],storagePath:paths.get(String(row.id))??null}});
  const clients=[...new Set(items.map(item=>item.client))].sort();const first=(data??[]).find(row=>row.recommended_publish_at)?.recommended_publish_at;
  const periodLabel=first?new Intl.DateTimeFormat("en",{month:"long",year:"numeric",timeZone:"Asia/Dubai"}).format(new Date(first)):"Posting queue";
  return{items,clients,periodLabel,isDemo:false};
}
