"use client";

import { useMemo, useState, useTransition } from "react";
import { Flag, MessageSquare, Send, X } from "lucide-react";
import {
  getPostingImageUrl,
  updatePostingStatus,
  updatePostingStatuses,
} from "@/app/staff/actions";
import type { StaffQueueItem, StaffQueueStatus } from "@/lib/staff-data";
import { Status } from "./ui";

type Props = {
  initial: StaffQueueItem[];
  clients: string[];
  isDemo: boolean;
  initialTab?: StaffQueueStatus;
};
const tabs: StaffQueueStatus[] = [
  "Ready for Design",
  "Poster Created",
  "Ready to schedule",
  "Scheduled",
  "Published",
  "Issue",
];
const dbStatus: Record<StaffQueueStatus, string> = {
  "Ready for Design":"ready_for_design",
  "Poster Created":"poster_created",
  "Ready to schedule": "ready_to_schedule",
  Scheduled: "scheduled",
  Published: "published",
  Issue: "issue",
};

export function PostingQueue({
  initial,
  clients,
  isDemo,
  initialTab = "Ready for Design",
}: Props) {
  const [items, setItems] = useState(initial),
    [tab, setTab] = useState<StaffQueueStatus>(initialTab);
  const [client, setClient] = useState("All clients"),
    [month, setMonth] = useState("All months"),
    [platform, setPlatform] = useState("All platforms");
  const [issue, setIssue] = useState<StaffQueueItem | null>(null),
    [copied, setCopied] = useState<string | null>(null),
    [notice, setNotice] = useState("");
  const [pending, startTransition] = useTransition();
  const platforms = useMemo(
    () =>
      [...new Set(items.flatMap((item) => item.platform.split(" + ")))].sort(),
    [items],
  );
  const months = useMemo(
    () => [...new Set(items.map((item) => item.month))].sort(),
    [items],
  );
  const matchesFilters = (item: StaffQueueItem) =>
    (client === "All clients" || item.client === client) &&
    (month === "All months" || item.month === month) &&
    (platform === "All platforms" || item.platform.includes(platform));
  const visible = items.filter(
    (item) => item.status === tab && matchesFilters(item),
  );

  async function copyCaption(item: StaffQueueItem) {
    await navigator.clipboard?.writeText(
      `${item.caption}${item.hashtags ? `\n\n${item.hashtags}` : ""}`,
    );
    setCopied(item.id);
  }
  async function copyPrompt(item:StaffQueueItem){await navigator.clipboard?.writeText(item.imagePrompt);setCopied(`prompt-${item.id}`)}
  async function uploadPoster(item:StaffQueueItem,file:File){setNotice("");const body=new FormData();body.set("contentId",item.id);body.set("poster",file);const response=await fetch("/api/staff/posters",{method:"POST",body});const result=await response.json() as {ok?:boolean;error?:string};if(!response.ok){setNotice(result.error??"Poster upload failed.");return}setItems(rows=>rows.map(row=>row.id===item.id?{...row,status:"Poster Created"}:row));setNotice("Poster uploaded securely and marked Poster Created.");setTab("Poster Created")}

  function download(item: StaffQueueItem) {
    if (!isDemo) {
      startTransition(async () => {
        const result = await getPostingImageUrl(item.id);
        if (result.ok) window.open(result.url, "_blank", "noopener,noreferrer");
        else setNotice(result.error);
      });
      return;
    }
    const safe = item.topic.replace(/[<>&"]/g, ""),
      svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080"><rect width="100%" height="100%" fill="#ded8c9"/><text x="50%" y="48%" text-anchor="middle" font-family="Georgia" font-size="58" fill="#302d2a">${safe}</text><text x="50%" y="55%" text-anchor="middle" font-family="Arial" font-size="24" fill="#6554d9">${item.client} · Demo creative</text></svg>`;
    const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml" })),
      anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `social-creative-${item.id}.svg`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function changeStatus(
    item: StaffQueueItem,
    next: StaffQueueStatus,
    note = "",
  ) {
    const before = items;
    setNotice("");
    setItems((rows) =>
      rows.map((row) =>
        row.id === item.id ? { ...row, status: next, issueNote: note } : row,
      ),
    );
    if (isDemo) return;
    startTransition(async () => {
      const result = await updatePostingStatus(item.id, dbStatus[next], note);
      if (!result.ok) {
        setItems(before);
        setNotice(result.error);
      }
    });
  }

  function batch(next: StaffQueueStatus) {
    const ids = visible.map((item) => item.id),
      before = items;
    if (!ids.length) return;
    setNotice("");
    setItems((rows) =>
      rows.map((row) =>
        ids.includes(row.id) ? { ...row, status: next } : row,
      ),
    );
    if (isDemo) {
      setNotice(`${ids.length} posts moved to ${next.toLowerCase()}.`);
      return;
    }
    startTransition(async () => {
      const result = await updatePostingStatuses(ids, dbStatus[next]);
      if (!result.ok) {
        setItems(before);
        setNotice(result.error);
      } else setNotice(`${ids.length} posts moved to ${next.toLowerCase()}.`);
    });
  }

  return (
    <>
      {notice && (
        <div className="form-error" role="alert">
          {notice}
        </div>
      )}
      <div className="posting-filters">
        <div className="posting-tabs">
          {tabs.map((name) => (
            <button
              key={name}
              className={tab === name ? "active" : ""}
              onClick={() => setTab(name)}
            >
              {name} ·{" "}
              {
                items.filter(
                  (item) => item.status === name && matchesFilters(item),
                ).length
              }
            </button>
          ))}
        </div>
        <select
          aria-label="Client filter"
          value={client}
          onChange={(event) => setClient(event.target.value)}
        >
          <option>All clients</option>
          {clients.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <select
          aria-label="Month filter"
          value={month}
          onChange={(event) => setMonth(event.target.value)}
        >
          <option>All months</option>
          {months.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
        <select
          aria-label="Platform filter"
          value={platform}
          onChange={(event) => setPlatform(event.target.value)}
        >
          <option>All platforms</option>
          {platforms.map((name) => (
            <option key={name}>{name}</option>
          ))}
        </select>
      </div>
      {visible.length > 1 &&
        ["Ready to schedule", "Scheduled"].includes(tab) && (
          <div className="posting-batch">
            <span>{visible.length} filtered posts</span>
            <button
              className="button"
              disabled={pending}
              onClick={() =>
                batch(tab === "Ready to schedule" ? "Scheduled" : "Published")
              }
            >
              {tab === "Ready to schedule"
                ? "Mark all scheduled"
                : "Mark all published"}
            </button>
          </div>
        )}
      <div className="post-list">
        {visible.length ? (
          visible.map((item) => (
            <article className="post-card" key={item.id} aria-busy={pending}>
              <div
                className={`post-creative ${item.color} ${item.imageUrl ? "generated" : ""}`}
                style={
                  item.imageUrl
                    ? {
                        backgroundImage: `linear-gradient(#15241b22,#15241b88),url("${item.imageUrl}")`,
                      }
                    : undefined
                }
                role={item.imageUrl ? "img" : undefined}
                aria-label={
                  item.imageUrl ? `Creative for ${item.topic}` : undefined
                }
              >
                <span>{item.topic}</span>
              </div>
              <div className="post-body">
                <div className="post-meta">
                  {item.client} · {item.platform}
                </div>
                <h3>{item.posterHeadline}</h3><small>
                  {item.date} · {item.time}
                </small>
                <p><b>Creative direction:</b> {item.creativeBrief}</p>
                <p>{item.caption}</p>
                {item.hashtags && <p className="hashtags">{item.hashtags}</p>}
                <div style={{ marginTop: 8 }}>
                  <Status
                    tone={
                      item.status === "Scheduled"
                        ? "purple"
                        : item.status === "Issue"
                          ? "risk"
                          : ""
                    }
                  >
                    {item.status}
                  </Status>
                </div>
                {item.issueNote && (
                  <div className="issue-note">
                    <Flag size={12} />
                    {item.issueNote}
                  </div>
                )}
              </div>
              <div className="post-actions">
                <button onClick={() => copyPrompt(item)}>{copied===`prompt-${item.id}`?"Prompt copied ✓":"Copy Image Prompt"}</button>
                <button onClick={() => copyCaption(item)}>
                  {copied === item.id ? "Copied ✓" : "Copy caption"}
                </button>
                {item.status==="Ready for Design"&&<label className="button secondary upload-poster">Upload Poster<input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={event=>{const file=event.target.files?.[0];if(file)void uploadPoster(item,file)}}/></label>}
                <button
                  onClick={() => download(item)}
                  title={
                    item.storagePath
                      ? "Download creative"
                      : "Download generated preview"
                  }
                >
                  Download image
                </button>
                {item.status === "Ready to schedule" && (
                  <button
                    className="primary"
                    disabled={pending}
                    onClick={() => changeStatus(item, "Scheduled")}
                  >
                    Mark scheduled
                  </button>
                )}
                {item.status==="Poster Created"&&<button className="primary" disabled={pending} onClick={()=>changeStatus(item,"Ready to schedule")}>Mark Ready to Schedule</button>}
                {item.status === "Scheduled" && (
                  <button
                    className="primary"
                    disabled={pending}
                    onClick={() => changeStatus(item, "Published")}
                  >
                    Mark published
                  </button>
                )}
                <button disabled={pending} onClick={() => setIssue(item)}>
                  <MessageSquare size={12} />
                  Report issue
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <b>No {tab.toLowerCase()} posts</b>
            <p>Items will appear here after internal review.</p>
          </div>
        )}
      </div>
      {issue && (
        <div className="modal-wrap">
          <form
            className="modal"
            action={(formData) => {
              const note = String(formData.get("note") ?? "");
              changeStatus(issue, "Issue", note);
              setIssue(null);
              setTab("Issue");
            }}
          >
            <header>
              <h2>Report publishing issue</h2>
              <button
                type="button"
                className="ghost-icon"
                onClick={() => setIssue(null)}
              >
                <X size={18} />
              </button>
            </header>
            <div className="modal-body field">
              <label>Note for partner</label>
              <textarea
                name="note"
                required
                placeholder="Explain what is blocking this post…"
              />
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="button secondary"
                onClick={() => setIssue(null)}
              >
                Cancel
              </button>
              <button className="button">
                <Send size={13} />
                Report issue
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
