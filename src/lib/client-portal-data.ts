import "server-only";
import {isDemoMode} from "@/lib/demo-mode";
import {createClient} from "@/lib/supabase/server";
import type {ClientFile,ClientProfile,ClientRequest} from "@/lib/client-portal-store";

export type ClientPortalData={profile?:ClientProfile;files?:ClientFile[];requests?:ClientRequest[]};
const titleCase=(value:string)=>value.replaceAll("_"," ").replace(/\b\w/g,letter=>letter.toUpperCase());
const shortDate=(value:string)=>new Intl.DateTimeFormat("en-AE",{day:"numeric",month:"short",timeZone:"Asia/Dubai"}).format(new Date(value));

async function clientContext(){
  const supabase=await createClient();
  const {data:{user}}=await supabase.auth.getUser();
  if(!user)return null;
  const {data:membership,error}=await supabase.from("client_members").select("client_id").eq("user_id",user.id).limit(1).maybeSingle();
  if(error)throw error;
  return membership?.client_id?{supabase,clientId:membership.client_id as string}:null;
}

export async function loadClientPortalData(section:string):Promise<ClientPortalData|undefined>{
  if(isDemoMode())return undefined;
  const context=await clientContext();
  if(!context)return undefined;
  const {supabase,clientId}=context;
  if(section==="business"){
    const [{data:client,error:clientError},{data:profile,error:profileError},{data:services,error:servicesError},{data:locations,error:locationsError}]=await Promise.all([
      supabase.from("clients").select("industry").eq("id",clientId).single(),
      supabase.from("business_profiles").select("description,target_customers,value_proposition,tone_of_voice,business_hours,phone,whatsapp,email,website,offers").eq("client_id",clientId).maybeSingle(),
      supabase.from("business_services").select("name").eq("client_id",clientId).eq("status","active").order("name"),
      supabase.from("business_locations").select("name").eq("client_id",clientId).eq("status","active").order("name"),
    ]);
    if(clientError)throw clientError;if(profileError)throw profileError;if(servicesError)throw servicesError;if(locationsError)throw locationsError;
    return {profile:{description:profile?.description??"",industry:client.industry??"",services:(services??[]).map(item=>item.name).join(", "),locations:(locations??[]).map(item=>item.name).join(", "),customers:profile?.target_customers??"",value:profile?.value_proposition??"",tone:profile?.tone_of_voice??"",hours:profile?.business_hours??"",phone:profile?.phone??"",whatsapp:profile?.whatsapp??"",email:profile?.email??"",website:profile?.website??"",offers:profile?.offers??""}};
  }
  if(section==="files"){
    const {data,error}=await supabase.from("assets").select("id,filename,category,storage_path,created_at").eq("client_id",clientId).is("deleted_at",null).order("created_at",{ascending:false});
    if(error)throw error;
    const files=await Promise.all((data??[]).map(async asset=>{const {data:signed}=await supabase.storage.from("client-assets").createSignedUrl(asset.storage_path,300);return {id:asset.id,name:asset.filename,category:titleCase(asset.category),size:"Stored securely",created:shortDate(asset.created_at),downloadUrl:signed?.signedUrl}}));
    return {files};
  }
  if(section==="requests"){
    const {data,error}=await supabase.from("client_requests").select("id,request_type,title,description,status,created_at").eq("client_id",clientId).order("created_at",{ascending:false});
    if(error)throw error;
    return {requests:(data??[]).map(request=>({id:request.id,type:titleCase(request.request_type),title:request.title,description:request.description??"",status:titleCase(request.status),created:shortDate(request.created_at)}))};
  }
  return undefined;
}
