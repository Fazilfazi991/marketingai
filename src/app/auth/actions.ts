"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { homeForRole, resolveAppRole } from "@/lib/access-control";
import { timed } from "@/lib/performance";
export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim(),
    password = String(formData.get("password") ?? "");
  if (!email || !password)
    redirect("/?error=Email%20and%20password%20are%20required");
  let destination = "/",
    message = "";
  try {
    const supabase = await createClient();
    const { data, error } = await timed("login.credentials", () =>
      supabase.auth.signInWithPassword({ email, password }),
    );
    if (error || !data.user)
      message = "Sign-in failed. Check your details and try again.";
    else {
      const [membership, clientMembership] = await timed(
        "login.membership",
        () =>
          Promise.all([
            supabase
              .from("organization_members")
              .select("role")
              .eq("user_id", data.user.id)
              .eq("status", "active")
              .limit(1)
              .maybeSingle(),
            supabase
              .from("client_members")
              .select("client_id")
              .eq("user_id", data.user.id)
              .limit(1)
              .maybeSingle(),
          ]),
      );
      if (membership.error || clientMembership.error)
        message = "Your workspace could not be loaded. Please try again.";
      else {
        const role = resolveAppRole(
          membership.data?.role,
          Boolean(clientMembership.data),
        );
        if (role) destination = homeForRole(role);
        else message = "No active Growth1000 membership";
      }
      if (message) await supabase.auth.signOut();
    }
  } catch {
    message = "Sign-in is temporarily unavailable. Please try again.";
  }
  redirect(message ? `/?error=${encodeURIComponent(message)}` : destination);
}
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
