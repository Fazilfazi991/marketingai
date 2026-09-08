import "server-only";

import { isDemoMode } from "@/lib/demo-mode";
import { createClient } from "@/lib/supabase/server";

export type AdminClientListItem = {
  name: string;
  slug: string;
  services: string;
  status: string;
  health: string;
  progress: number;
  access: string;
  owner: string;
};

export type AdminClientWorkspaceData = {
  id: string;
  name: string;
  slug: string;
  location: string;
  health: string;
  profile: {
    description: string;
    industry: string;
    services: string;
    locations: string;
    customers: string;
    value: string;
    tone: string;
    website: string;
    claims: string;
  };
  access: Array<{ name: string; status: string }>;
  scope: Array<{ key: string; label: string; enabled: boolean; quantity: number }>;
};

const titleCase = (value: string) => value.replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
const accessTypes = ["Website", "Google Analytics", "Search Console", "Instagram", "Facebook", "WhatsApp"];
const demoClients: Record<string, Pick<AdminClientWorkspaceData, "name" | "location" | "health">> = {
  "abc-interiors": { name: "ABC Interiors", location: "Dubai, UAE", health: "Needs Attention" },
  "smile-dental": { name: "Smile Dental", location: "Dubai, UAE", health: "Healthy" },
  "xyz-maintenance": { name: "XYZ Maintenance", location: "Sharjah, UAE", health: "At Risk" },
};

function demoAdminClient(slug: string): AdminClientWorkspaceData {
  const identity = demoClients[slug] ?? { name: titleCase(slug), location: "UAE", health: "Healthy" };
  return {
    id: `demo-${slug}`,
    slug,
    ...identity,
    profile: {
      description: `${identity.name} is a demo client workspace used to preview Growth1000 operations.`,
      industry: slug === "abc-interiors" ? "Interior Design / Renovation" : "",
      services: slug === "abc-interiors" ? "Kitchen Renovation, Villa Renovation, Wardrobes, Interior Fit-out" : "",
      locations: identity.location.replace(", UAE", ""),
      customers: "Local customers in the UAE",
      value: "Clear, measurable growth",
      tone: "Warm, expert, clear",
      website: "",
      claims: "Never invent prices, guarantees, certifications or testimonials.",
    },
    access: accessTypes.map(name => ({ name, status: name === "WhatsApp" ? "Pending" : "Connected" })),
    scope: [
      { key: "seo", label: "SEO", enabled: true, quantity: 1 },
      { key: "social_media", label: "Social media posts", enabled: true, quantity: 12 },
      { key: "blogs", label: "SEO blogs", enabled: true, quantity: 2 },
      { key: "website_maintenance", label: "Website maintenance", enabled: true, quantity: 1 },
      { key: "website_chatbot", label: "Website AI chatbot", enabled: true, quantity: 1 },
      { key: "whatsapp_ai", label: "WhatsApp AI", enabled: true, quantity: 1 },
      { key: "analytics_reporting", label: "Analytics and reporting", enabled: true, quantity: 1 },
    ],
  };
}

export async function loadAdminClients(): Promise<AdminClientListItem[] | undefined> {
  if (isDemoMode()) return undefined;
  const supabase = await createClient();
  const { data: clients, error } = await supabase.from("clients").select("id,name,slug,lifecycle_status,health_status").is("deleted_at", null).order("name");
  if (error) throw error;
  const ids = (clients ?? []).map(item => item.id as string);
  if (!ids.length) return [];
  const [{ data: scopes, error: scopeError }, { data: access, error: accessError }] = await Promise.all([
    supabase.from("client_service_scopes").select("client_id,enabled").in("client_id", ids),
    supabase.from("client_access").select("client_id,access_type,status").in("client_id", ids),
  ]);
  if (scopeError) throw scopeError;
  if (accessError) throw accessError;
  return (clients ?? []).map(client => {
    const clientScopes = (scopes ?? []).filter(item => item.client_id === client.id && item.enabled);
    const missingAccess = (access ?? []).find(item => item.client_id === client.id && item.status !== "connected");
    const status = titleCase(String(client.lifecycle_status));
    return {
      name: String(client.name), slug: String(client.slug), services: `${clientScopes.length} active services`, status,
      health: titleCase(String(client.health_status)), progress: status === "Active" ? 100 : 45,
      access: missingAccess ? `${titleCase(String(missingAccess.access_type))} ${titleCase(String(missingAccess.status)).toLowerCase()}` : "All connected",
      owner: "Partner team",
    };
  });
}

export async function loadAdminClient(slug: string): Promise<AdminClientWorkspaceData | null | undefined> {
  if (isDemoMode()) return demoAdminClient(slug);
  const supabase = await createClient();
  const { data: client, error } = await supabase.from("clients").select("id,name,slug,industry,city,country,health_status").eq("slug", slug).is("deleted_at", null).single();
  if (error) return null;
  const clientId = client.id as string;
  const [{ data: profile, error: profileError }, { data: services, error: servicesError }, { data: locations, error: locationsError }, { data: access, error: accessError }, { data: scope, error: scopeError }] = await Promise.all([
    supabase.from("business_profiles").select("description,target_customers,value_proposition,tone_of_voice,website,prohibited_claims").eq("client_id", clientId).maybeSingle(),
    supabase.from("business_services").select("name").eq("client_id", clientId).eq("status", "active").order("name"),
    supabase.from("business_locations").select("name").eq("client_id", clientId).eq("status", "active").order("name"),
    supabase.from("client_access").select("access_type,status").eq("client_id", clientId).order("access_type"),
    supabase.from("client_service_scopes").select("service_key,label,enabled,monthly_quantity").eq("client_id", clientId).order("label"),
  ]);
  for (const requestError of [profileError, servicesError, locationsError, accessError, scopeError]) if (requestError) throw requestError;
  return {
    id: clientId, name: String(client.name), slug: String(client.slug), location: [client.city, client.country].filter(Boolean).join(", "), health: titleCase(String(client.health_status)),
    profile: { description: profile?.description ?? "", industry: client.industry ?? "", services: (services ?? []).map(item => item.name).join(", "), locations: (locations ?? []).map(item => item.name).join(", "), customers: profile?.target_customers ?? "", value: profile?.value_proposition ?? "", tone: profile?.tone_of_voice ?? "", website: profile?.website ?? "", claims: profile?.prohibited_claims ?? "" },
    access: accessTypes.map(name => {
      const match = (access ?? []).find(item => titleCase(String(item.access_type)) === name);
      return { name, status: match ? titleCase(String(match.status)) : "Not Connected" };
    }),
    scope: (scope ?? []).map(item => ({ key: String(item.service_key), label: String(item.label), enabled: Boolean(item.enabled), quantity: Number(item.monthly_quantity ?? 1) })),
  };
}
