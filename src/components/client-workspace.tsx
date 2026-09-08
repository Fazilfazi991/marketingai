"use client";

import Link from "next/link";
import { useState } from "react";
import { saveBusinessKnowledge, saveClientAccess, saveServiceScope } from "@/app/admin/clients/actions";
import type { AdminClientWorkspaceData } from "@/lib/admin-data";
import { access as seedAccess, monthlyObligations } from "@/lib/demo-data";
import { Panel, Status } from "./ui";
import { BlogsWorkspace, SeoWorkspace } from "./blogs-seo-workspace";
import { LeadManager } from "./lead-manager";

const tabs = ["overview", "business", "access", "scope", "social", "blogs", "seo", "website", "analytics", "leads", "reports", "tasks", "notes"];
const labels: Record<string, string> = { business: "Business Knowledge", scope: "Service Scope" };
const initialProfile = { description: "ABC Interiors is a Dubai interior design and renovation studio focused on thoughtful, practical spaces.", industry: "Interior Design / Renovation", services: "Kitchen Renovation, Villa Renovation, Wardrobes, Interior Fit-out", locations: "Dubai, Sharjah", customers: "Villa and apartment owners", value: "Thoughtful spaces built around everyday life", tone: "Warm, expert, clear", website: "https://abcinteriors.example", claims: "Never invent prices, guarantees, certifications or testimonials." };
const initialScope = [
  { key: "seo", label: "SEO", enabled: true, quantity: 1 },
  { key: "social_media", label: "Social media posts", enabled: true, quantity: 12 },
  { key: "blogs", label: "SEO blogs", enabled: true, quantity: 2 },
  { key: "website_maintenance", label: "Website maintenance", enabled: true, quantity: 1 },
  { key: "website_chatbot", label: "Website AI chatbot", enabled: true, quantity: 1 },
  { key: "whatsapp_ai", label: "WhatsApp AI", enabled: true, quantity: 1 },
  { key: "analytics_reporting", label: "Analytics and reporting", enabled: true, quantity: 1 },
];

export function ClientWorkspace({ section, initial, live = false }: { section: string; initial?: AdminClientWorkspaceData; live?: boolean }) {
  const slug = initial?.slug ?? "abc-interiors";
  const [saved, setSaved] = useState(false);
  const [notice, setNotice] = useState("");
  const [profile, setProfile] = useState(initial?.profile ?? initialProfile);
  const [connections, setConnections] = useState(initial?.access ?? seedAccess.map(([name, status]) => ({ name, status: status as string })));
  const [scope, setScope] = useState(initial?.scope ?? initialScope);
  const [generated, setGenerated] = useState(false);

  const saveProfile = async () => { if (live) { const result = await saveBusinessKnowledge(slug, profile); setNotice(result.ok ? "Business knowledge saved securely." : result.error); } else { localStorage.setItem("g1-abc-profile", JSON.stringify(profile)); setNotice("Business knowledge saved in local demo mode."); } setSaved(true); };
  const setAccess = async (name: string, status: string) => { const next = connections.map(item => item.name === name ? { ...item, status } : item); setConnections(next); if (live) { const result = await saveClientAccess(slug, name, status); setNotice(result.ok ? `${name} access updated securely.` : result.error); } else { localStorage.setItem("g1-abc-access", JSON.stringify(next)); setNotice("Access status saved in local demo mode."); } setSaved(true); };
  const saveScope = async () => { if (live) { const result = await saveServiceScope(slug, scope); setNotice(result.ok ? "Service scope saved securely." : result.error); } else { localStorage.setItem("g1-abc-service-scope", JSON.stringify(scope)); setNotice("Service scope saved in local demo mode."); } setSaved(true); };

  const overview = <div className="workspace-layout">
    <Panel title="September delivery" meta="Generated from the active client service scope"><div className="panel-body">{monthlyObligations.map(item => <div className="obligation" key={item.type}><div className="obligation-top"><b>{item.type}</b><span>{item.done} / {item.total}</span></div><div className="progress-track"><i style={{ width: `${item.done / item.total * 100}%` }} /></div></div>)}<div className="save-row"><button className="button secondary" onClick={() => setGenerated(true)}>{generated ? "October obligations generated" : "Generate October obligations"}</button></div></div></Panel>
    <Panel title="Access health" meta="5 connected · 1 pending"><div className="access-list">{connections.map(item => <div className="access-row" key={item.name}><span>{item.name}</span><Status tone={item.status === "Pending" ? "warn" : ""}>{item.status}</Status></div>)}</div></Panel>
  </div>;

  let content = overview;
  if (section === "business") content = <Panel title="Business knowledge" meta="Verified information used by content, SEO and AI workflows"><div className="panel-body form-grid"><Field label="Company description" full value={profile.description} onChange={value => setProfile({ ...profile, description: value })} area /><Field label="Industry" value={profile.industry} onChange={value => setProfile({ ...profile, industry: value })} /><Field label="Services" value={profile.services} onChange={value => setProfile({ ...profile, services: value })} /><Field label="Locations" value={profile.locations} onChange={value => setProfile({ ...profile, locations: value })} /><Field label="Target customers" value={profile.customers} onChange={value => setProfile({ ...profile, customers: value })} /><Field label="Value proposition" full value={profile.value} onChange={value => setProfile({ ...profile, value })} /><Field label="Tone of voice" value={profile.tone} onChange={value => setProfile({ ...profile, tone: value })} /><Field label="Website" value={profile.website} onChange={value => setProfile({ ...profile, website: value })} /><Field label="Prohibited claims / AI guardrails" full value={profile.claims} onChange={value => setProfile({ ...profile, claims: value })} area /><div className="field full save-row"><button className="button" onClick={saveProfile}>Save business profile</button></div></div></Panel>;
  if (section === "access") content = <Panel title="Access & integrations" meta="References only—never store client passwords here"><div className="panel-body">{connections.map(item => <div className="check-row" key={item.name}><b>{item.name}</b><select aria-label={`${item.name} status`} value={item.status} onChange={event => setAccess(item.name, event.target.value)}><option>Connected</option><option>Pending</option><option>Not Connected</option><option>Demo</option><option>Coming Later</option></select><small>Verified Sep 6</small></div>)}</div></Panel>;
  if (section === "scope") content = <Panel title="Client service scope" meta="Internal configuration that controls monthly work obligations"><div className="panel-body">{scope.map((service, index) => <div className="scope-row" key={service.key}><label><input type="checkbox" checked={service.enabled} onChange={event => setScope(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, enabled: event.target.checked } : item))} /> <b>{service.label}</b></label><label>Monthly quantity<input type="number" min="1" value={service.quantity} disabled={!service.enabled} onChange={event => setScope(items => items.map((item, itemIndex) => itemIndex === index ? { ...item, quantity: Number(event.target.value) } : item))} /></label></div>)}<div className="save-row"><button className="button" onClick={saveScope}>Save service scope</button></div></div></Panel>;
  if (section === "tasks") content = <Panel title="Client tasks" meta="Work generated from service scope obligations and manual requests"><div>{["Review November social batch", "Complete monthly website check", "Prepare September report"].map((item, index) => <div className="task-item" key={item}><div><b>{item}</b><p>{index === 0 ? "Due today · Maya" : "Due this week · Partner"}</p></div><Status tone={index === 2 ? "warn" : "purple"}>{index === 0 ? "Awaiting review" : index === 1 ? "In progress" : "Not started"}</Status></div>)}</div></Panel>;
  if (section === "seo") content = <SeoWorkspace />;
  if (section === "blogs") content = <BlogsWorkspace />;
  if (section === "social") content = <Panel title="Social content" meta="Centralized internal review and staff handoff"><div className="empty-state"><b>Manage this client’s social pipeline in the central content queue.</b><p>Generate, edit and approve posts before they move directly to staff for manual publishing.</p><Link className="button" href="/admin/content">Open social content</Link></div></Panel>;
  if (section === "leads") content = <LeadManager slug={slug} initial={initial?.leads ?? []} live={live} />;
  if (["website", "analytics", "reports", "notes"].includes(section)) content = <Panel title={labels[section] ?? section[0].toUpperCase() + section.slice(1)} meta="Client operations workspace"><div className="empty-state"><b>This workspace is ready for live client data.</b><p>Connect the relevant source to replace the clearly marked demo state.</p></div></Panel>;

  return <><div className="workspace-head"><span className="avatar">{(initial?.name ?? "ABC Interiors").split(" ").map(part => part[0]).join("").slice(0, 2)}</span><div><h2>{initial?.name ?? "ABC Interiors"}</h2><p>{scope.filter(item => item.enabled).length} active services · {initial?.location ?? "Dubai, UAE"}</p></div><span style={{ marginLeft: "auto" }}><Status tone={initial?.health === "Healthy" ? "" : "warn"}>{initial?.health ?? "Needs attention"}</Status></span></div><div className="workspace-tabs">{tabs.map(tab => <Link className={section === tab ? "active" : ""} key={tab} href={`/admin/clients/${slug}/${tab === "overview" ? "" : tab}`}>{labels[tab] ?? tab[0].toUpperCase() + tab.slice(1)}</Link>)}</div>{saved && <div className="toast" role="status">{notice}</div>}{content}</>;
}

function Field({ label, value, onChange, full, area }: { label: string; value: string; onChange: (value: string) => void; full?: boolean; area?: boolean }) {
  return <div className={`field ${full ? "full" : ""}`}><label>{label}</label>{area ? <textarea value={value} onChange={event => onChange(event.target.value)} /> : <input value={value} onChange={event => onChange(event.target.value)} />}</div>;
}
