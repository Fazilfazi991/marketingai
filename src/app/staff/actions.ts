"use server";
import {revalidatePath} from "next/cache";import {createClient} from "@/lib/supabase/server";
type Result={ok:true}|{ok:false;error:string};const allowed=new Set(["ready_to_post","scheduled","published","issue"]);
export async function updatePostingStatus(id:string,status:string,note=""):Promise<Result>{
  if(!/^[0-9a-f-]{36}$/i.test(id)||!allowed.has(status))return{ok:false,error:"Invalid posting update."};
  try{const supabase=await createClient();const{data:{user}}=await supabase.auth.getUser();if(!user)return{ok:false,error:"Sign in before updating the queue."};
    const{data:membership,error:membershipError}=await supabase.from("organization_members").select("role").eq("user_id",user.id).eq("status","active").in("role",["admin","staff"]).limit(1).maybeSingle();if(membershipError||!membership)return{ok:false,error:"Your account cannot update the posting queue."};
    const{error}=await supabase.from("content_items").update({status,staff_note:note.trim()||null}).eq("id",id);if(error)return{ok:false,error:error.message};revalidatePath("/staff");revalidatePath("/staff/issues");return{ok:true};
  }catch(error){return{ok:false,error:error instanceof Error?error.message:"The posting queue could not be updated."}}
}
