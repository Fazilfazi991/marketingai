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
  lifecycle: string;
  city: string;
  country: string;
  profile: {
    description: string;
    industry: string;
    services: string;
    locations: string;
    customers: string;
    value: string;
    tone: string;
    businessHours: string;
    phone: string;
    whatsapp: string;
    email: string;
    website: string;
    offers: string;
    competitors: string;
    importantClaims: string;
    claims: string;
    faqs: string;
  };
  access: Array<{ name: string; status: string; platform: string; accountReference: string; notes: string; verifiedAt?: string }>;
  scope: Array<{ key: string; label: string; enabled: boolean; quantity: number }>;
  delivery: { month: string; label: string; obligations: Array<{ type: string; label: string; done: number; total: number; status: string }> };
  leads: AdminLeadItem[];
  tasks: Array<{ id: string; title: string; status: string; category: string; due: string }>;
  reports: Array<{ id: string; month: string; status: string; summary: string }>;
  analytics: { users: number; sessions: number; clicks: number; impressions: number };
  blogs: Array<{id:string;title:string;keyword:string;status:string;updated:string}>;
  keywords: Array<{id:string;keyword:string;url:string;current:number|null;previous:number|null;priority:string}>;
  seoActions: Array<{id:string;title:string;page:string;status:string;impact:string}>;
  activity: Array<{ id: string; action: string; detail: string; actor: string; createdAt: string }>;
};

export type AdminLeadItem = { id: string; name: string; contact: string; source: string; service: string; quality: string; status: string; createdAt: string };

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
    ...identity, lifecycle:"Active", city:identity.location.split(",")[0], country:"UAE",
    profile: {
      description: `${identity.name} is a demo client workspace used to preview Growth1000 operations.`,
      industry: slug === "abc-interiors" ? "Interior Design / Renovation" : "",
      services: slug === "abc-interiors" ? "Kitchen Renovation, Villa Renovation, Wardrobes, Interior Fit-out" : "",
      locations: slug === "abc-interiors" ? "Dubai, Sharjah" : identity.location.replace(", UAE", ""),
      customers: "Local customers in the UAE",
      value: "Clear, measurable growth",
      tone: "Warm, expert, clear",
      businessHours: "Monday–Saturday, 9:00 AM–6:00 PM",
      phone: "+971 4 555 0100",
      whatsapp: "+971 50 555 0100",
      email: "hello@abcinteriors.example",
      website: slug === "abc-interiors" ? "https://abcinteriors.example" : "",
      offers: "Free initial design consultation",
      competitors: "Local Dubai renovation and fit-out studios",
      importantClaims: "Serves Dubai and Sharjah; specializes in practical residential renovation.",
      claims: "Never invent prices, guarantees, certifications or testimonials.",
      faqs: "Do you renovate occupied villas? | Project feasibility is confirmed during the initial consultation.\nWhich locations do you serve? | Dubai and Sharjah.",
    },
    access: accessTypes.map(name => ({ name, status: name === "WhatsApp" ? "Pending" : "Connected", platform: name, accountReference: name === "Website" ? "abcinteriors.example" : "Demo account reference", notes: name === "WhatsApp" ? "Awaiting business account access." : "Demo access confirmed." })),
    scope: [
      { key: "seo", label: "SEO", enabled: true, quantity: 1 },
      { key: "social_media", label: "Social media posts", enabled: true, quantity: 12 },
      { key: "blogs", label: "SEO blogs", enabled: true, quantity: 2 },
      { key: "website_maintenance", label: "Website maintenance", enabled: true, quantity: 1 },
      { key: "website_chatbot", label: "Website AI chatbot", enabled: true, quantity: 1 },
      { key: "whatsapp_ai", label: "WhatsApp AI", enabled: true, quantity: 1 },
      { key: "analytics_reporting", label: "Analytics and reporting", enabled: true, quantity: 1 },
    ],
    delivery: { month: "2026-09", label: "September 2026", obligations: [{type:"social_media",label:"Social media posts",done:9,total:12,status:"In Progress"},{type:"blogs",label:"SEO blogs",done:1,total:2,status:"In Progress"},{type:"seo",label:"SEO review",done:1,total:1,status:"Complete"},{type:"website_maintenance",label:"Website maintenance",done:1,total:1,status:"Complete"},{type:"analytics_reporting",label:"Monthly report",done:0,total:1,status:"Pending"}] },
    leads: [
      { id: "demo-lead-1", name: "Aisha Rahman", contact: "+971 50 555 0147", source: "WhatsApp", service: "Villa renovation", quality: "High Intent", status: "New", createdAt: "8 Sep · 10:24" },
      { id: "demo-lead-2", name: "Omar Nasser", contact: "omar@example.com", source: "Website Chatbot", service: "Kitchen renovation", quality: "Qualified", status: "Contacted", createdAt: "7 Sep · 16:42" },
      { id: "demo-lead-3", name: "Mariam Ali", contact: "+971 55 555 0182", source: "Website Form", service: "Wardrobes", quality: "Qualified", status: "Qualified", createdAt: "6 Sep · 09:15" },
    ],
    tasks: [{id:"demo-task-1",title:"Review November social batch",status:"Awaiting Internal Review",category:"Social",due:"Today"},{id:"demo-task-2",title:"Complete monthly website check",status:"In Progress",category:"Website",due:"This week"},{id:"demo-task-3",title:"Prepare September report",status:"Not Started",category:"Reporting",due:"30 Sep"}],
    reports: [{id:"demo-report-1",month:"September 2026",status:"Needs Review",summary:"Strong delivery and improving organic discovery created a clear base for next month’s growth work."}],
    analytics: {users:1842,sessions:2369,clicks:624,impressions:18420},
    blogs:[{id:"demo-blog-1",title:"The complete guide to villa renovation in Dubai",keyword:"villa renovation dubai",status:"Internal Review",updated:"Today"},{id:"demo-blog-2",title:"Kitchen layouts that work for Dubai homes",keyword:"kitchen renovation dubai",status:"Draft",updated:"6 Sep"}],
    keywords:[{id:"demo-keyword-1",keyword:"kitchen renovation dubai",url:"/kitchen-renovation",current:8,previous:11,priority:"High"},{id:"demo-keyword-2",keyword:"villa renovation dubai",url:"/villa-renovation",current:14,previous:19,priority:"High"}],
    seoActions:[{id:"demo-seo-1",title:"Publish villa renovation planning guide",page:"/villa-renovation",status:"In Progress",impact:"High"},{id:"demo-seo-2",title:"Add project proof to wardrobe page",page:"/wardrobes",status:"Open",impact:"High"}],
    activity:[{id:"demo-audit-1",action:"Access updated",detail:"WhatsApp marked Pending",actor:"Fazil",createdAt:"Today · 10:24"},{id:"demo-audit-2",action:"Service scope updated",detail:"7 enabled services",actor:"Fazil",createdAt:"7 Sep · 16:40"},{id:"demo-audit-3",action:"Monthly delivery generated",detail:"September 2026",actor:"Growth1000",createdAt:"1 Sep · 08:05"}],
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
  const { data: client, error } = await supabase.from("clients").select("id,name,slug,industry,city,country,lifecycle_status,health_status").eq("slug", slug).is("deleted_at", null).single();
  if (error) return null;
  const clientId = client.id as string;
  const month = new Date().toISOString().slice(0, 7), monthStart = `${month}-01`, endDate = new Date(`${monthStart}T00:00:00Z`); endDate.setUTCMonth(endDate.getUTCMonth() + 1); const monthEnd = endDate.toISOString().slice(0, 10);
  const [{ data: profile, error: profileError }, { data: services, error: servicesError }, { data: locations, error: locationsError }, { data: faqs, error: faqError }, { data: access, error: accessError }, { data: scope, error: scopeError }, { data: leads, error: leadsError }, {data:tasks,error:tasksError},{data:reports,error:reportsError},{data:analytics,error:analyticsError},{data:search,error:searchError},{data:blogs,error:blogsError},{data:keywords,error:keywordsError},{data:seoActions,error:seoActionsError},{data:activity,error:activityError}] = await Promise.all([
    supabase.from("business_profiles").select("description,target_customers,value_proposition,tone_of_voice,business_hours,phone,whatsapp,email,website,offers,competitors,important_claims,prohibited_claims").eq("client_id", clientId).maybeSingle(),
    supabase.from("business_services").select("name").eq("client_id", clientId).eq("status", "active").order("name"),
    supabase.from("business_locations").select("name").eq("client_id", clientId).eq("status", "active").order("name"),
    supabase.from("business_faqs").select("question,answer").eq("client_id",clientId).order("question"),
    supabase.from("client_access").select("access_type,platform,status,account_reference,notes,verified_at").eq("client_id", clientId).order("access_type"),
    supabase.from("client_service_scopes").select("service_key,label,enabled,monthly_quantity").eq("client_id", clientId).order("label"),
    supabase.from("leads").select("id,name,phone,email,source,service,lead_quality,status,created_at").eq("client_id", clientId).order("created_at", { ascending: false }).limit(100),
    supabase.from("tasks").select("id,title,status,category,due_at").eq("client_id",clientId).order("due_at",{ascending:true,nullsFirst:false}).limit(20),
    supabase.from("reports").select("id,month,status,summary").eq("client_id",clientId).order("month",{ascending:false}).limit(6),
    supabase.from("analytics_daily").select("metrics").eq("client_id",clientId).gte("day",monthStart).lt("day",monthEnd),
    supabase.from("search_console_daily").select("metrics").eq("client_id",clientId).gte("day",monthStart).lt("day",monthEnd),
    supabase.from("content_items").select("id,topic,target_keyword,status,updated_at").eq("client_id",clientId).eq("content_kind","blog").order("updated_at",{ascending:false}).limit(20),
    supabase.from("seo_keywords").select("id,keyword,target_url,current_position,previous_position,priority").eq("client_id",clientId).order("updated_at",{ascending:false}).limit(30),
    supabase.from("seo_tasks").select("id,title,target_url,status,impact").eq("client_id",clientId).order("updated_at",{ascending:false}).limit(30),
    supabase.from("audit_logs").select("id,action,entity_type,metadata,created_at,profiles(full_name)").eq("client_id",clientId).order("created_at",{ascending:false}).limit(40),
  ]);
  for (const requestError of [profileError, servicesError, locationsError, faqError, accessError, scopeError, leadsError,tasksError,reportsError,analyticsError,searchError,blogsError,keywordsError,seoActionsError,activityError]) if (requestError) throw requestError;
  const { data: period, error: periodError } = await supabase.from("delivery_periods").select("month,delivery_obligations(deliverable_type,label,promised_quantity,delivered_quantity,status)").eq("client_id", clientId).eq("month", monthStart).maybeSingle();
  if (periodError) throw periodError;
  const obligations = (period?.delivery_obligations ?? []) as Array<{deliverable_type:string;label:string;promised_quantity:number;delivered_quantity:number;status:string}>;
  return {
    id: clientId, name: String(client.name), slug: String(client.slug), location: [client.city, client.country].filter(Boolean).join(", "), health: titleCase(String(client.health_status)), lifecycle:titleCase(String(client.lifecycle_status)),city:client.city??"",country:client.country??"UAE",
    profile: { description: profile?.description ?? "", industry: client.industry ?? "", services: (services ?? []).map(item => item.name).join(", "), locations: (locations ?? []).map(item => item.name).join(", "), customers: profile?.target_customers ?? "", value: profile?.value_proposition ?? "", tone: profile?.tone_of_voice ?? "", businessHours: profile?.business_hours ?? "", phone: profile?.phone ?? "", whatsapp: profile?.whatsapp ?? "", email: profile?.email ?? "", website: profile?.website ?? "", offers: profile?.offers ?? "", competitors: profile?.competitors ?? "", importantClaims: profile?.important_claims ?? "", claims: profile?.prohibited_claims ?? "", faqs: (faqs ?? []).map(item => `${item.question} | ${item.answer}`).join("\n") },
    access: accessTypes.map(name => {
      const match = (access ?? []).find(item => titleCase(String(item.access_type)) === name);
      return { name, status: match ? titleCase(String(match.status)) : "Not Connected", platform: match?.platform ?? name, accountReference: match?.account_reference ?? "", notes: match?.notes ?? "", verifiedAt: match?.verified_at ? new Intl.DateTimeFormat("en-AE", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Dubai" }).format(new Date(match.verified_at)) : undefined };
    }),
    scope: (scope ?? []).map(item => ({ key: String(item.service_key), label: String(item.label), enabled: Boolean(item.enabled), quantity: Number(item.monthly_quantity ?? 1) })),
    delivery: { month, label: new Intl.DateTimeFormat("en-AE", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${monthStart}T00:00:00Z`)), obligations: obligations.map(item => ({ type: String(item.deliverable_type), label: String(item.label), done: Number(item.delivered_quantity), total: Number(item.promised_quantity), status: titleCase(String(item.status)) })) },
    leads: (leads ?? []).map(item => ({ id: String(item.id), name: item.name || "Unnamed enquiry", contact: item.phone || item.email || "No contact supplied", source: titleCase(String(item.source)), service: item.service || "Not specified", quality: titleCase(String(item.lead_quality)), status: titleCase(String(item.status)), createdAt: new Intl.DateTimeFormat("en-AE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(item.created_at)) })),
    tasks:(tasks??[]).map(item=>({id:String(item.id),title:String(item.title),status:titleCase(String(item.status)),category:titleCase(String(item.category)),due:item.due_at?new Intl.DateTimeFormat("en-AE",{day:"numeric",month:"short",timeZone:"Asia/Dubai"}).format(new Date(item.due_at)):"No due date"})),
    reports:(reports??[]).map(item=>({id:String(item.id),month:new Intl.DateTimeFormat("en-AE",{month:"long",year:"numeric",timeZone:"UTC"}).format(new Date(`${item.month}T00:00:00Z`)),status:titleCase(String(item.status)),summary:item.summary??"No summary recorded."})),
    analytics:{users:(analytics??[]).reduce((sum,row)=>sum+(Number((row.metrics as Record<string,unknown>)?.users)||Number((row.metrics as Record<string,unknown>)?.visitors)||0),0),sessions:(analytics??[]).reduce((sum,row)=>sum+(Number((row.metrics as Record<string,unknown>)?.sessions)||0),0),clicks:(search??[]).reduce((sum,row)=>sum+(Number((row.metrics as Record<string,unknown>)?.clicks)||0),0),impressions:(search??[]).reduce((sum,row)=>sum+(Number((row.metrics as Record<string,unknown>)?.impressions)||0),0)},
    blogs:(blogs??[]).map(item=>({id:String(item.id),title:item.topic??"Untitled article",keyword:item.target_keyword??"No target keyword",status:titleCase(String(item.status)),updated:new Intl.DateTimeFormat("en-AE",{day:"numeric",month:"short",timeZone:"Asia/Dubai"}).format(new Date(item.updated_at))})),
    keywords:(keywords??[]).map(item=>({id:String(item.id),keyword:String(item.keyword),url:item.target_url??"No target page",current:item.current_position,previous:item.previous_position,priority:titleCase(String(item.priority??"medium"))})),
    seoActions:(seoActions??[]).map(item=>({id:String(item.id),title:item.title??"SEO action",page:item.target_url??"No target page",status:titleCase(String(item.status??"open")),impact:titleCase(String(item.impact??"medium"))})),
    activity:(activity??[]).map(item=>{const meta=(item.metadata??{}) as Record<string,unknown>,profile=item.profiles as {full_name?:string}|{full_name?:string}[]|null,actor=(Array.isArray(profile)?profile[0]?.full_name:profile?.full_name)??"Growth1000";return{id:String(item.id),action:titleCase(String(item.action).replaceAll(".","_")),detail:String(meta.access_type??meta.service??meta.name??meta.month??meta.health??item.entity_type??"Client operation"),actor,createdAt:new Intl.DateTimeFormat("en-AE",{day:"numeric",month:"short",hour:"2-digit",minute:"2-digit",timeZone:"Asia/Dubai"}).format(new Date(item.created_at))}}),
  };
}
