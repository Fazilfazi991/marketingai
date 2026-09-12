"use client";
import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  ArrowUpRight,
  RefreshCw,
  MessageSquare,
  X,
} from "lucide-react";
import { WorkflowNotificationFeed } from "./client-notifications";
import {
  agentPrompts,
  statusLabel,
  type AgentWorkspace,
  type AgentRequest,
} from "@/lib/agent-workflow";

export function RequestDetail({
  request,
  data,
  onReply,
}: {
  request: AgentRequest;
  data: AgentWorkspace;
  onReply?: () => void;
}) {
  return (
    <section className="agent-request-detail" aria-label="Request details">
      <div className="agent-row">
        <h2>{request.title}</h2>
        <span className="agent-status">{statusLabel(request.status)}</span>
      </div>
      <p className="agent-original">{request.description}</p>
      <p className="agent-meta">
        Created {new Date(request.created_at).toLocaleDateString("en-GB")}
      </p>
      <h3>Progress</h3>
      <ol className="agent-history">
        {data.events
          .filter((e) => e.request_id === request.id)
          .map((e) => (
            <li key={e.id}>
              <span>{statusLabel(e.status)}</span>
              <time dateTime={e.created_at}>
                {new Date(e.created_at).toLocaleDateString("en-GB")}
              </time>
              <p>{e.body}</p>
            </li>
          ))}
      </ol>
      {request.latest_update && (
        <p className="agent-latest">{request.latest_update}</p>
      )}
      {onReply && (
        <button className="agent-primary" onClick={onReply}>
          Continue conversation <ArrowUpRight size={16} />
        </button>
      )}
    </section>
  );
}

export function AgentConversation({ initial }: { initial: AgentWorkspace }) {
  const [data, setData] = useState(initial),
    [view, setView] = useState<"conversation" | "requests">("conversation");
  const [draft, setDraft] = useState(""),
    [sending, setSending] = useState(false),
    [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null),
    [selected, setSelected] = useState<string | null>(null);
  const submission = useRef<{
    body: string;
    conversation: string | null;
    key: string;
  } | null>(null);
  const busy = useRef(false),
    input = useRef<HTMLTextAreaElement>(null),
    end = useRef<HTMLDivElement>(null);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const viewport = window.visualViewport;
    const sync = () => {
      const keyboard = Boolean(
        viewport && window.innerHeight - viewport.height > 120,
      );
      root.current?.classList.toggle("agent-keyboard", keyboard);
      document.documentElement.classList.toggle(
        "agent-keyboard-open",
        keyboard,
      );
      if (viewport && root.current) {
        const top = root.current.getBoundingClientRect().top + window.scrollY;
        root.current.style.setProperty(
          "--agent-height",
          `${Math.max(220, viewport.height + viewport.offsetTop - top - (keyboard ? 8 : window.innerWidth <= 760 ? 92 : 24))}px`,
        );
      }
    };
    sync();
    viewport?.addEventListener("resize", sync);
    viewport?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      viewport?.removeEventListener("resize", sync);
      viewport?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      document.documentElement.classList.remove("agent-keyboard-open");
    };
  }, []);
  async function refresh() {
    setRefreshing(true);
    try {
      const response = await fetch("/api/agent/workflow", {
        cache: "no-store",
      });
      const next = await response.json();
      if (!response.ok || next.unavailable) throw new Error();
      setData(next);
      setError("");
    } catch {
      setError(
        "Couldn’t refresh your conversation. Try again; saved messages remain stored.",
      );
    } finally {
      setRefreshing(false);
    }
  }
  async function send(event: React.FormEvent) {
    event.preventDefault();
    const body = draft.trim();
    if (!body || busy.current || data.isDemo || data.unavailable) return;
    busy.current = true;
    setSending(true);
    setError("");
    setNotice("");
    if (
      !submission.current ||
      submission.current.body !== body ||
      submission.current.conversation !== replyTo
    )
      submission.current = {
        body,
        conversation: replyTo,
        key: crypto.randomUUID(),
      };
    try {
      const response = await fetch("/api/agent/workflow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(submission.current),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(
          result.error ?? "Couldn’t save your message. Please retry.",
        );
      setDraft("");
      submission.current = null;
      setReplyTo(null);
      setNotice("Message saved. Your team will update you here.");
      await refresh();
      requestAnimationFrame(() => {
        end.current?.scrollIntoView({ block: "nearest" });
        input.current?.focus({ preventScroll: true });
      });
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Connection interrupted. Your draft is still here. Retry to save it.",
      );
    } finally {
      busy.current = false;
      setSending(false);
    }
  }
  const selectedRequest = data.requests.find((r) => r.id === selected);
  const topic = data.topics.find((t) => t.id === replyTo);
  return (
    <div className="agent-workspace" ref={root}>
      <WorkflowNotificationFeed
        scope={data.scope}
        notices={data.notifications}
      />
      <header className="agent-workspace-heading">
        <div>
          <h1>Your Growth Agent</h1>
          <p>{data.clientName} · Your business growth workspace</p>
        </div>
        <button
          className="agent-icon"
          aria-label="Refresh conversation"
          disabled={refreshing}
          onClick={refresh}
        >
          <RefreshCw size={18} />
        </button>
      </header>
      <div
        className="agent-view-switch"
        role="group"
        aria-label="Workspace view"
      >
        <button
          aria-pressed={view === "conversation"}
          onClick={() => setView("conversation")}
        >
          Conversation
        </button>
        <button
          aria-pressed={view === "requests"}
          onClick={() => setView("requests")}
        >
          Requests{data.requests.length > 0 ? ` (${data.requests.length})` : ""}
        </button>
      </div>
      {(data.isDemo || data.unavailable) && (
        <p className="agent-banner">
          {data.isDemo
            ? "Read-only demo. Messages and requests can be sent in a connected, signed-in workspace."
            : "The conversation service is unavailable. Your team needs to enable it before you can send."}
        </p>
      )}
      {error && (
        <p role="alert" className="agent-error">
          {error}
        </p>
      )}
      <p className="agent-live" role="status">
        {sending ? "Saving your message…" : refreshing ? "Refreshing…" : notice}
      </p>
      {view === "conversation" ? (
        <>
          <div
            className="agent-ledger"
            role="region"
            aria-label="Conversation history"
            tabIndex={0}
          >
            {!data.messages.length ? (
              <div className="agent-empty">
                <MessageSquare size={24} />
                <h2>What would you like to work on?</h2>
                <p>
                  Ask about your results or tell us what your business needs.
                  Work requests go to your team for review.
                </p>
                <div className="agent-prompts">
                  {agentPrompts.map((prompt) => (
                    <button
                      key={prompt}
                      onClick={() => {
                        setDraft(prompt);
                        input.current?.focus();
                      }}
                    >
                      {prompt}
                      <ArrowUpRight size={15} />
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              data.messages.map((message) => {
                const request = data.requests.find(
                  (r) => r.conversation_id === message.conversation_id,
                );
                return (
                  <article
                    key={message.id}
                    className={`agent-message agent-message-${message.sender_type}`}
                  >
                    <div className="agent-meta">
                      <strong>
                        {message.sender_type === "client"
                          ? "You"
                          : message.sender_type === "staff"
                            ? "Your growth team"
                            : "Workspace receipt"}
                      </strong>
                      <time dateTime={message.created_at}>
                        {new Date(message.created_at).toLocaleString("en-GB", {
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                    </div>
                    <p>{message.body}</p>
                    {message.sender_type === "system" && request && (
                      <button
                        className="agent-receipt"
                        onClick={() => {
                          setSelected(request.id);
                          setView("requests");
                        }}
                      >
                        <span>
                          <strong>{request.title}</strong>
                          <small>{statusLabel(request.status)}</small>
                        </span>
                        <span>
                          View request <ArrowUpRight size={14} />
                        </span>
                      </button>
                    )}
                    {message.sender_type !== "system" && (
                      <button
                        className="agent-text-action"
                        onClick={() => {
                          setReplyTo(message.conversation_id);
                          input.current?.focus();
                        }}
                      >
                        Reply to this topic
                      </button>
                    )}
                  </article>
                );
              })
            )}
            <div ref={end} />
          </div>
          <form className="agent-composer" onSubmit={send}>
            {topic && (
              <div className="agent-reply-context">
                <span>Replying: {topic.title}</span>
                <button
                  type="button"
                  aria-label="Start a new topic instead"
                  onClick={() => setReplyTo(null)}
                >
                  <X size={16} />
                </button>
              </div>
            )}
            <label htmlFor="agent-message">Message your growth team</label>
            <div className="agent-composer-controls">
              <textarea
                ref={input}
                id="agent-message"
                placeholder="What would you like to work on?"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={4000}
                rows={2}
                disabled={sending}
              />
              <button
                className="agent-primary"
                type="submit"
                aria-label="Send message"
                disabled={
                  sending || !draft.trim() || data.isDemo || data.unavailable
                }
              >
                <ArrowUp size={19} />
                <span>{sending ? "Saving…" : "Send"}</span>
              </button>
            </div>
            <p>
              Messages are saved after you send. Your team reviews requests
              before work begins.
            </p>
          </form>
        </>
      ) : (
        <div className="agent-ledger">
          {!data.requests.length ? (
            <div className="agent-empty">
              <h2>Your requests will appear here</h2>
              <p>
                Tell your Growth Agent what you need. You’ll be able to follow
                progress and team updates in this space.
              </p>
              <button
                className="agent-primary"
                onClick={() => setView("conversation")}
              >
                Start a conversation
              </button>
            </div>
          ) : (
            <div className="agent-request-list">
              {data.requests.map((r) => (
                <button
                  key={r.id}
                  aria-pressed={selected === r.id}
                  onClick={() => setSelected(r.id)}
                >
                  <span>{r.title}</span>
                  <span className="agent-status">{statusLabel(r.status)}</span>
                </button>
              ))}
            </div>
          )}
          {selectedRequest && (
            <RequestDetail
              request={selectedRequest}
              data={data}
              onReply={() => {
                setReplyTo(selectedRequest.conversation_id);
                setView("conversation");
                requestAnimationFrame(() => input.current?.focus());
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
