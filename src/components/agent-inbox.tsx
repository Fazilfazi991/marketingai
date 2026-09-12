"use client";
import { useRef, useState } from "react";
import {
  requestCategories,
  requestStatuses,
  statusLabel,
  type AgentWorkspace,
} from "@/lib/agent-workflow";
import { RequestDetail } from "./agent-conversation";
import { agentDate, agentTime } from "@/lib/agent-date";
export function AgentInbox({ initial }: { initial: AgentWorkspace }) {
  const [data, setData] = useState(initial),
    [selected, setSelected] = useState(initial.topics[0]?.id ?? "");
  const [filter, setFilter] = useState("all"),
    [search, setSearch] = useState("");
  const [draft, setDraft] = useState(""),
    [mode, setMode] = useState("reply"),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const lock = useRef(false),
    submission = useRef<{
      action: string;
      value: string;
      topic: string;
      key: string;
    } | null>(null);
  const topic = data.topics.find((t) => t.id === selected),
    request = data.requests.find((r) => r.conversation_id === selected);
  async function refresh() {
    const response = await fetch("/api/agent/workflow?staff=true", {
      cache: "no-store",
    });
    const result = await response.json();
    if (!response.ok || result.unavailable)
      throw new Error("Couldn’t reload the inbox. Refresh to try again.");
    setData(result);
  }
  async function act(action: string, value: string) {
    if (lock.current || data.isDemo || data.unavailable || !topic) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setNotice("");
    if (
      !submission.current ||
      submission.current.action !== action ||
      submission.current.value !== value ||
      submission.current.topic !== selected
    )
      submission.current = {
        action,
        value,
        topic: selected,
        key: crypto.randomUUID(),
      };
    try {
      const response = await fetch("/api/agent/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          value,
          conversation: selected,
          key: submission.current.key,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      submission.current = null;
      if (action === "reply" || action === "note") setDraft("");
      setNotice(
        action === "note"
          ? "Internal note saved. Not visible to the client."
          : "Update saved.",
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn’t save. Please retry.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const disabled = busy || data.isDemo || data.unavailable;
  const items = data.topics.filter((t) => {
    const r = data.requests.find((r) => r.conversation_id === t.id);
    return (
      `${t.clientName} ${t.title}`
        .toLowerCase()
        .includes(search.toLowerCase()) &&
      (filter === "all" ||
        (filter === "question" && t.kind === "question") ||
        r?.status === filter)
    );
  });
  return (
    <div className="agent-inbox">
      {(data.isDemo || data.unavailable) && (
        <p className="agent-banner">
          {data.isDemo
            ? "Read-only demo. The inbox will contain real client conversations once connected."
            : "The conversation service is unavailable. Ask your administrator to restore access."}
        </p>
      )}
      <p className="agent-meta">
        {data.isAdmin
          ? "Incoming questions and requests. Assign an owner to give staff access."
          : "Your assigned conversations and requests. Configuration and assignment are managed by admins."}
      </p>
      <div className="agent-inbox-filters">
        <label>
          Search client or request
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search…"
          />
        </label>
        <label>
          Status
          <select value={filter} onChange={(e) => setFilter(e.target.value)}>
            <option value="all">All</option>
            <option value="question">Questions</option>
            {Object.entries(requestStatuses).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button onClick={() => refresh().catch((e) => setError(e.message))}>
          Refresh inbox
        </button>
      </div>
      {error && (
        <p role="alert" className="agent-error">
          {error}
        </p>
      )}
      <p role="status">{busy ? "Saving update…" : notice}</p>
      <div className="agent-inbox-grid">
        <div className="agent-inbox-list">
          {!items.length && (
            <p>
              No matching conversations. New client messages will appear here
              when you have access.
            </p>
          )}
          {items.map((t) => (
            <button
              disabled={busy}
              aria-pressed={selected === t.id}
              key={t.id}
              onClick={() => {
                if (
                  draft &&
                  !window.confirm(
                    "Discard the unsent draft and open another conversation?",
                  )
                )
                  return;
                setSelected(t.id);
                setDraft("");
                setError("");
              }}
            >
              <small>{t.clientName}</small>
              <strong>{t.title}</strong>
              <span>
                {statusLabel(
                  data.requests.find((r) => r.conversation_id === t.id)
                    ?.status ?? t.status,
                )}
              </span>
            </button>
          ))}
        </div>
        {topic && (
          <section className="agent-inbox-detail">
            <p className="agent-meta">
              {topic.clientName} ·{" "}
              {agentDate(topic.created_at)}
            </p>
            {request ? (
              <RequestDetail request={request} data={data} />
            ) : (
              <h2>{topic.title}</h2>
            )}
            <div className="agent-team-controls">
              {request && topic.kind === "request" && (
                <>
                  <label>
                    Request status
                    <select
                      disabled={disabled}
                      value={request.status}
                      onChange={(e) => act("status", e.target.value)}
                    >
                      {Object.entries(requestStatuses)
                        .filter(([v]) => v !== "cancelled")
                        .map(([v, l]) => (
                          <option key={v} value={v}>
                            {l}
                          </option>
                        ))}
                    </select>
                  </label>
                  <label>
                    Category
                    <select
                      disabled={disabled}
                      value={request.request_type}
                      onChange={(e) => act("category", e.target.value)}
                    >
                      {Object.entries(requestCategories).map(([v, l]) => (
                        <option key={v} value={v}>
                          {l}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
              {topic.kind === "question" && (
                <button disabled={disabled} onClick={() => act("request", "")}>
                  Record as a work request
                </button>
              )}
              {topic.kind === "request" &&
                request &&
                ["received", "reviewing"].includes(request.status) && (
                  <button
                    disabled={disabled}
                    onClick={() => act("question", "")}
                  >
                    Reclassify as a question
                  </button>
                )}
              {data.isAdmin && (
                <label>
                  Owner
                  <select
                    disabled={disabled}
                    value={topic.assigned_user_id ?? ""}
                    onChange={(e) => act("assign", e.target.value)}
                  >
                    <option value="">Unassigned</option>
                    {data.owners.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
            <h3>Client conversation</h3>
            <div className="agent-team-messages">
              {data.messages
                .filter((m) => m.conversation_id === selected)
                .map((m) => (
                  <article className="agent-message" key={m.id}>
                    <div className="agent-meta">
                      <strong>
                        {m.sender_type === "client"
                          ? "Client"
                          : m.sender_type === "staff"
                            ? "Team reply"
                            : "Workspace receipt"}
                      </strong>
                      <time dateTime={m.created_at}>
                        {agentTime(m.created_at)}
                      </time>
                    </div>
                    <p>{m.body}</p>
                  </article>
                ))}
            </div>
            <details className="agent-notes">
              <summary>
                Internal notes · Staff only (
                {
                  data.notes.filter((n) => n.conversation_id === selected)
                    .length
                }
                )
              </summary>
              {data.notes
                .filter((n) => n.conversation_id === selected)
                .map((n) => (
                  <p key={n.id}>{n.body}</p>
                ))}
            </details>
            <form
              className="agent-staff-reply"
              onSubmit={(e) => {
                e.preventDefault();
                act(mode, draft.trim());
              }}
            >
              <label>
                Message visibility
                <select
                  value={mode}
                  disabled={busy}
                  onChange={(e) => setMode(e.target.value)}
                >
                  <option value="reply">Reply to client</option>
                  <option value="note">Internal note — staff only</option>
                </select>
              </label>
              <p>
                {mode === "note"
                  ? "Only the internal team can read this note."
                  : "This reply will be visible in the client’s Ask Agent conversation."}
              </p>
              <label htmlFor="staff-message">
                {mode === "note" ? "Internal note" : "Reply to client"}
              </label>
              <textarea
                id="staff-message"
                value={draft}
                disabled={busy}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={4000}
                rows={4}
              />
              <button
                className="agent-primary"
                disabled={disabled || !draft.trim()}
              >
                {busy
                  ? "Saving…"
                  : mode === "note"
                    ? "Save internal note"
                    : "Send reply to client"}
              </button>
            </form>
          </section>
        )}
      </div>
    </div>
  );
}
