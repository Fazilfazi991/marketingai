"use client";

import { useMemo, useState, useTransition } from "react";
import { Flag, MessageSquare, Send, X } from "lucide-react";
import { getPostingImageUrl, updatePostingStatus, updatePostingStatuses } from "@/app/staff/actions";
import type { StaffQueueItem, StaffQueueStatus } from "@/lib/staff-data";
import { Status } from "./ui";

type Props = { initial: StaffQueueItem[]; clients: string[]; isDemo: boolean; initialTab?: StaffQueueStatus };
const tabs: StaffQueueStatus[] = ["Ready to schedule", "Scheduled", "Published", "Issue"];
const dbStatus: Record<StaffQueueStatus, string> = { "Ready to schedule": "ready_to_post", Scheduled: "scheduled", Published: "published", Issue: "issue" };

export function PostingQueue({ initial, clients, isDemo, initialTab = "Ready to schedule" }: Props) {
  const [items, setItems] = useState(initial), [tab, setTab] = useState<StaffQueueStatus>(initialTab);
  const [client, setClient] = useState("All clients"), [month, setMonth] = useState("All months"), [platform, setPlatform] = useState("All platforms");
  const [issue, setIssue] = useState<StaffQueueItem | null>(null), [copied, setCopied] = useState<string | null>(null), [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const platforms = useMemo(() => [...new Set(items.flatMap(item => item.platform.split(" + ")))].sort(), [items]);
  const months = useMemo(() => [...new Set(items.map(item => item.month))].sort(), [items]);
  const matchesFilters = (item: StaffQueueItem) => (client === "All clients" || item.client === client) && (month === "All months" || item.month === month) && (platform === "All platforms" || item.platform.includes(platform));
  const visible = items.filter(item => item.status === tab && matchesFilters(item));

  async function copy(item: StaffQueueItem) {
    await navigator.clipboard?.writeText(`${item.caption}${item.hashtags ? `\n\n${item.hashtags}` : ""}`);
    setCopied(item.id);
  }

  function download(item: StaffQueueItem) {
    if (!isDemo) {
      startTransition(async () => { const result = await getPostingImageUrl(item.id); if (result.ok) window.open(result.url, "_blank", "noopener,noreferrer"); else setNotice(result.error); });
      return;
    }
    const safe = item.topic.replace(/[<>&"]/g, ""), svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><rect width="100%" height="100%" fill="#ded8c9"/><text x="50%" y="48%" text-anchor="middle" font-family="Georgia" font-size="58" fill="#302d2a">${safe}</text><text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="24" fill="#6554d9">${item.client} · Demo creative</text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })), anchor = document.createElement("a");
    anchor.href = url; anchor.download = `social-creative-${item.id}.svg`; anchor.click(); URL.revokeObjectURL(url);
  }

  function changeStatus(item: StaffQueueItem, next: StaffQueueStatus, note = "") {
    const before = items; setNotice(""); setItems(rows => rows.map(row => row.id === item.id ? { ...row, status: next, issueNote: note } : row));
    if (isDemo) return;
    startTransition(async () => { const result = await updatePostingStatus(item.id, dbStatus[next], note); if (!result.ok) { setItems(before); setNotice(result.error); } });
  }

  function batch(next: StaffQueueStatus) {
    const ids = visible.map(item => item.id), before = items; if (!ids.length) return;
    setNotice(""); setItems(rows => rows.map(row => ids.includes(row.id) ? { ...row, status: next } : row));
    if (isDemo) { setNotice(`${ids.length} posts moved to ${next.toLowerCase()}.`); return; }
    startTransition(async () => { const result = await updatePostingStatuses(ids, dbStatus[next]); if (!result.ok) { setItems(before); setNotice(result.error); } else setNotice(`${ids.length} posts moved to ${next.toLowerCase()}.`); });
  }

  return <>
    {notice && <div className="form-error" role="alert">{notice}</div>}
    <div className="posting-filters">
      <div className="posting-tabs">{tabs.map(name => <button key={name} className={tab === name ? "active" : ""} onClick={() => setTab(name)}>{name} · {items.filter(item => item.status === name && matchesFilters(item)).length}</button>)}</div>
      <select aria-label="Client filter" value={client} onChange={event => setClient(event.target.value)}><option>All clients</option>{clients.map(name => <option key={name}>{name}</option>)}</select>
      <select aria-label="Month filter" value={month} onChange={event => setMonth(event.target.value)}><option>All months</option>{months.map(name => <option key={name}>{name}</option>)}</select>
      <select aria-label="Platform filter" value={platform} onChange={event => setPlatform(event.target.value)}><option>All platforms</option>{platforms.map(name => <option key={name}>{name}</option>)}</select>
    </div>
    {visible.length > 1 && ["Ready to schedule", "Scheduled"].includes(tab) && <div className="posting-batch"><span>{visible.length} filtered posts</span><button className="button" disabled={pending} onClick={() => batch(tab === "Ready to schedule" ? "Scheduled" : "Published")}>{tab === "Ready to schedule" ? "Mark all scheduled" : "Mark all published"}</button></div>}
    <div className="post-list">{visible.length ? visible.map(item => <article className="post-card" key={item.id} aria-busy={pending}><div className={`post-creative ${item.color}`}><span>{item.topic}</span></div><div className="post-body"><div className="post-meta">{item.client} · {item.platform}</div><h3>{item.date} · {item.time}</h3><p>{item.caption}</p>{item.hashtags && <p className="hashtags">{item.hashtags}</p>}<div style={{ marginTop: 8 }}><Status tone={item.status === "Scheduled" ? "purple" : item.status === "Issue" ? "risk" : ""}>{item.status}</Status></div>{item.issueNote && <div className="issue-note"><Flag size={12}/>{item.issueNote}</div>}</div><div className="post-actions"><button onClick={() => copy(item)}>{copied === item.id ? "Copied ✓" : "Copy caption"}</button><button onClick={() => download(item)} title={item.storagePath ? "Download creative" : "Download generated preview"}>Download image</button>{item.status === "Ready to schedule" && <button className="primary" disabled={pending} onClick={() => changeStatus(item, "Scheduled")}>Mark scheduled</button>}{item.status === "Scheduled" && <button className="primary" disabled={pending} onClick={() => changeStatus(item, "Published")}>Mark published</button>}<button disabled={pending} onClick={() => setIssue(item)}><MessageSquare size={12}/>Report issue</button></div></article>) : <div className="empty-state"><b>No {tab.toLowerCase()} posts</b><p>Items will appear here after internal review.</p></div>}</div>
    {issue && <div className="modal-wrap"><form className="modal" action={formData => { const note = String(formData.get("note") ?? ""); changeStatus(issue, "Issue", note); setIssue(null); setTab("Issue"); }}><header><h2>Report publishing issue</h2><button type="button" className="ghost-icon" onClick={() => setIssue(null)}><X size={18}/></button></header><div className="modal-body field"><label>Note for partner</label><textarea name="note" required placeholder="Explain what is blocking this post…"/></div><div className="modal-actions"><button type="button" className="button secondary" onClick={() => setIssue(null)}>Cancel</button><button className="button"><Send size={13}/>Report issue</button></div></form></div>}
  </>;
}
