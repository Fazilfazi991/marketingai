"use client";

import Link from "next/link";
import { useState } from "react";
import { Plus, SlidersHorizontal, X } from "lucide-react";
import { createGrowthClient } from "@/app/admin/clients/actions";
import { clients as demoClients } from "@/lib/demo-data";
import type { AdminClientListItem } from "@/lib/admin-data";
import { Panel, Status } from "./ui";

const seeded: AdminClientListItem[] = demoClients.map(client => ({ ...client, slug: client.name.toLowerCase().replaceAll(" ", "-") }));

export function ClientManager({ initial }: { initial?: AdminClientListItem[] }) {
  const live = initial !== undefined;
  const [items, setItems] = useState(initial ?? seeded);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState("");
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState("All clients");
  const visible = items.filter(item => filter === "All clients" || item.status === filter || (filter === "Needs attention" && ["Needs Attention", "Needs attention", "At Risk", "At risk"].includes(item.health)));

  async function submit(data: FormData) {
    const name = String(data.get("name") ?? "").trim();
    if (!name) return;
    setSaving(true);
    if (live) {
      const result = await createGrowthClient(data);
      setSaving(false);
      if (!result.ok) { setNotice(result.error); return; }
      const services = ["seo", "social_media", "blogs", "website_maintenance", "website_chatbot", "whatsapp_ai", "analytics_reporting"].filter(key => data.get(key)).length;
      setItems(current => [{ name, slug: result.slug ?? "", services: `${services} active services`, status: "Onboarding", health: "Healthy", progress: 45, access: "Access checklist pending", owner: "Partner team" }, ...current]);
    } else {
      const services = ["seo", "social_media", "blogs", "website_maintenance", "website_chatbot", "whatsapp_ai", "analytics_reporting"].filter(key => data.get(key)).length;
      setItems(current => [{ name, slug: name.toLowerCase().replace(/[^a-z0-9]+/gi, "-").replace(/(^-|-$)/g, "").toLowerCase(), services: `${services} active services`, status: "Onboarding", health: "Healthy", progress: 10, access: "Access checklist pending", owner: "Partner team" }, ...current]);
      setSaving(false);
    }
    setOpen(false);
    setNotice(`${name} created with an internal service scope.`);
  }

  return <>
    {notice && <div className="toast" role="status">{notice}</div>}
    <Panel title="All clients" meta={`${items.filter(item => item.status === "Active").length} active · ${items.filter(item => item.status === "Onboarding").length} onboarding`} action={<button className="button" onClick={() => setOpen(true)}><Plus size={15} />New client</button>}>
      <div className="toolbar">{["All clients", "Active", "Onboarding", "Paused"].map(value => <button key={value} className={`filter ${filter === value ? "active" : ""}`} onClick={() => setFilter(value)}>{value}</button>)}<button className={`filter ${filter === "Needs attention" ? "active" : ""}`} onClick={() => setFilter("Needs attention")}><SlidersHorizontal size={12} />Needs attention</button></div>
      <div className="table-wrap"><table className="data-table"><thead><tr><th>Client</th><th>Service scope</th><th>Health</th><th>Onboarding</th><th>Access</th><th>Owner</th></tr></thead><tbody>{visible.map(client => <tr key={client.slug}><td><div className="client-name"><span className="avatar">{client.name.split(" ").map(part => part[0]).join("").slice(0, 2)}</span><span><Link className="client-link" href={`/admin/clients/${client.slug}`}>{client.name}</Link><small>{client.status}</small></span></div></td><td><b>{client.services}</b></td><td><Status tone={client.health === "Needs Attention" || client.health === "Needs attention" ? "warn" : client.health === "At Risk" || client.health === "At risk" ? "risk" : ""}>{client.health}</Status></td><td><div className="mini-progress"><span><i style={{ width: `${client.progress}%` }} /></span>{client.progress}%</div></td><td>{client.access}</td><td>{client.owner}</td></tr>)}</tbody></table>{!visible.length && <div className="empty-state"><b>No clients match this filter.</b><p>Choose another lifecycle or health view.</p></div>}</div>
    </Panel>
    {open && <div className="modal-wrap" role="dialog" aria-modal="true"><form className="modal" action={submit}><header><h2>Create client</h2><button type="button" className="ghost-icon" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button></header><div className="modal-body form-grid"><div className="field full"><label>Business name</label><input name="name" required placeholder="Business name" /></div><fieldset className="field full"><legend>Active services</legend><div className="service-scope-options">{[["seo", "SEO"], ["social_media", "Social Media · 12 posts/month"], ["blogs", "Blogs · 2/month"], ["website_maintenance", "Website Maintenance"], ["website_chatbot", "Website Chatbot"], ["whatsapp_ai", "WhatsApp AI"], ["analytics_reporting", "Analytics / Reporting"]].map(([key, label]) => <label key={key}><input type="checkbox" name={key} defaultChecked /> {label}</label>)}</div></fieldset><div className="field"><label>Industry</label><input name="industry" placeholder="e.g. Real estate" /></div><div className="field"><label>Location</label><input name="location" placeholder="Dubai, UAE" /></div></div><div className="modal-actions"><button type="button" className="button secondary" onClick={() => setOpen(false)}>Cancel</button><button className="button" disabled={saving}>{saving ? "Creating…" : "Create client"}</button></div></form></div>}
  </>;
}
