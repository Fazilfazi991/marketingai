"use client";

import { useState } from "react";
import { Plus, X } from "lucide-react";
import { createLead, updateLeadStatus } from "@/app/admin/clients/actions";
import type { AdminLeadItem } from "@/lib/admin-data";
import { Panel, Status } from "./ui";

const statuses = ["New", "Contacted", "Qualified", "Won", "Lost", "Spam"];
const normalize = (value: string) => value.toLowerCase().replaceAll(" ", "_");

export function LeadManager({ slug, initial, live }: { slug: string; initial: AdminLeadItem[]; live: boolean }) {
  const [items, setItems] = useState(initial), [open, setOpen] = useState(false), [saving, setSaving] = useState(false), [notice, setNotice] = useState("");
  async function submit(formData: FormData) {
    setSaving(true);
    const name = String(formData.get("name") ?? "").trim() || "Unnamed enquiry";
    const phone = String(formData.get("phone") ?? "").trim(), email = String(formData.get("email") ?? "").trim();
    if (name === "Unnamed enquiry" && !phone && !email) { setSaving(false); setNotice("Add a name, phone number or email address."); return; }
    const source = String(formData.get("source") ?? "manual").replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
    const quality = String(formData.get("quality") ?? "unqualified").replaceAll("_", " ").replace(/\b\w/g, letter => letter.toUpperCase());
    let id = `demo-${Date.now()}`;
    if (live) { const result = await createLead(slug, formData); if (!result.ok) { setSaving(false); setNotice(result.error); return; } id = result.id ?? id; }
    setItems(current => [{ id, name, contact: phone || email || "No contact supplied", source, service: String(formData.get("service") || "Not specified"), quality, status: "New", createdAt: "Just now" }, ...current]);
    setSaving(false); setOpen(false); setNotice(live ? "Lead saved securely." : "Lead added in local demo mode.");
  }
  async function changeStatus(id: string, status: string) {
    const previous = items; setItems(current => current.map(item => item.id === id ? { ...item, status } : item));
    if (live) { const result = await updateLeadStatus(slug, id, normalize(status)); if (!result.ok) { setItems(previous); setNotice(result.error); return; } }
    setNotice(`Lead moved to ${status}.`);
  }
  return <>{notice && <div className="toast" role="status">{notice}</div>}<Panel title="Lead register" meta={`${items.length} tracked enquiries`} action={<button className="button" onClick={() => setOpen(true)}><Plus size={14} />Add lead</button>}>{items.length ? <div className="table-wrap"><table className="data-table"><thead><tr><th>Lead</th><th>Source</th><th>Requirement</th><th>Quality</th><th>Status</th><th>Received</th></tr></thead><tbody>{items.map(item => <tr key={item.id}><td><div className="lead-contact"><b>{item.name}</b><small>{item.contact}</small></div></td><td>{item.source}</td><td>{item.service}</td><td><Status tone={item.quality === "High Intent" ? "warn" : "purple"}>{item.quality}</Status></td><td><select aria-label={`${item.name} status`} value={item.status} onChange={event => changeStatus(item.id, event.target.value)}>{statuses.map(status => <option key={status}>{status}</option>)}</select></td><td>{item.createdAt}</td></tr>)}</tbody></table></div> : <div className="empty-state"><b>No leads recorded yet.</b><p>Website forms, AI chatbots, WhatsApp and manual enquiries will appear here.</p></div>}</Panel>{open && <div className="modal-wrap" role="dialog" aria-modal="true"><form className="modal" action={submit}><header><h2>Add lead</h2><button type="button" className="ghost-icon" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button></header><div className="modal-body form-grid"><div className="field"><label>Name</label><input name="name" placeholder="Contact name" /></div><div className="field"><label>Source</label><select name="source" defaultValue="manual"><option value="manual">Manual</option><option value="whatsapp">WhatsApp</option><option value="website_chatbot">Website AI chatbot</option><option value="website_form">Website form</option><option value="instagram">Instagram</option><option value="facebook">Facebook</option><option value="google_business">Google Business</option><option value="phone">Phone</option><option value="other">Other</option></select></div><div className="field"><label>Phone</label><input name="phone" type="tel" placeholder="+971…" /></div><div className="field"><label>Email</label><input name="email" type="email" placeholder="name@example.com" /></div><div className="field"><label>Requirement / service</label><input name="service" placeholder="e.g. Villa renovation" /></div><div className="field"><label>Lead quality</label><select name="quality" defaultValue="unqualified"><option value="unqualified">Unqualified</option><option value="qualified">Qualified</option><option value="high_intent">High intent</option><option value="disqualified">Disqualified</option></select></div><div className="field full"><label>Qualification notes</label><textarea name="qualification" placeholder="Budget, timing, location and important context" /></div></div><div className="modal-actions"><button type="button" className="button secondary" onClick={() => setOpen(false)}>Cancel</button><button className="button" disabled={saving}>{saving ? "Saving…" : "Add lead"}</button></div></form></div>}</>;
}
