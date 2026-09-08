"use client";

import { ArrowUp, RotateCcw, Sparkles, Trash2, X } from "lucide-react";
import { FormEvent, useEffect, useRef, useState } from "react";
import type { ClientResultsData } from "@/lib/client-results";

type Message = { role: "assistant" | "user"; text: string };
const suggestions = ["How did we perform this period?", "Are leads improving?", "Which channel is working best?", "What should we focus on next?"];

export function GrowthAiIcon({ size = 28 }: { size?: number }) {
  return <svg aria-hidden="true" width={size} height={size} viewBox="0 0 32 32" fill="none"><path d="M16 5V2.5M16 2.5l2-1M16 2.5l-2-1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/><rect x="5" y="7" width="22" height="19" rx="7" fill="currentColor"/><path d="M10 27v2M22 27v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><circle cx="12" cy="15" r="2" fill="white"/><circle cx="20" cy="15" r="2" fill="white"/><path d="M11 20.5c1.4 1.2 3.1 1.8 5 1.8s3.6-.6 5-1.8" stroke="white" strokeWidth="1.7" strokeLinecap="round"/></svg>;
}

export function GrowthAiAssistant({ data }: { data: ClientResultsData }) {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([{ role: "assistant", text: `Hi — I’m ready to explain the verified results for ${data.clientName}, covering ${data.periodLabel}. What would you like to know?` }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [lastFailed, setLastFailed] = useState("");
  const log = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { log.current?.scrollTo({ top: log.current.scrollHeight, behavior: "smooth" }); }, [messages, loading]);
  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, [open]);

  async function ask(text: string) {
    const prompt = text.trim();
    if (!prompt || loading) return;
    setMessages(items => [...items, { role: "user", text: prompt }]);
    setQuestion(""); setError(""); setLoading(true);
    try {
      const response = await fetch("/api/client/assistant", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: prompt, range: data.rangeKey, from: data.rangeStart, to: data.rangeEnd, messages: messages.slice(-6).map((message) => ({ role: message.role, content: message.text })) }) });
      const result = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !result.answer) throw new Error(result.error ?? "No answer was returned.");
      setMessages(items => [...items, { role: "assistant", text: result.answer! }]);
    } catch (cause) { setLastFailed(prompt); setError(cause instanceof Error ? cause.message : "The assistant could not answer. Please try again."); }
    finally { setLoading(false); }
  }
  function submit(event: FormEvent) { event.preventDefault(); void ask(question); }

  return <>
    <button className={`growth-ai-launcher${open ? " open" : ""}`} aria-label="Ask Growth1000 AI" aria-expanded={open} onClick={() => setOpen(value => !value)}>{open ? <X size={22}/> : <GrowthAiIcon/>}<span>Ask Growth1000 AI</span></button>
    {open && <aside className="growth-ai-panel" aria-label="Growth1000 AI assistant" aria-modal="true" role="dialog">
      <header><div className="growth-ai-avatar"><GrowthAiIcon size={23}/></div><div><b>Growth Assistant</b><span><i/>Verified data · {data.periodLabel}</span></div><button aria-label="Clear conversation" title="Clear conversation" onClick={() => { setMessages([{ role: "assistant", text: `Conversation cleared. Ask me about ${data.periodLabel}.` }]); setError(""); }}><Trash2 size={16}/></button><button aria-label="Close assistant" onClick={() => setOpen(false)}><X size={18}/></button></header>
      <div className="growth-ai-log" ref={log} aria-live="polite">
        {messages.map((message, index) => <div className={`growth-ai-message ${message.role}`} key={`${message.role}-${index}`}>{message.text}</div>)}
        {messages.length === 1 && <div className="growth-ai-suggestions">{suggestions.map(item => <button key={item} onClick={() => void ask(item)}>{item}</button>)}</div>}
        {loading && <div className="growth-ai-message assistant loading"><span/><span/><span/><em>Checking your dashboard…</em></div>}
        {error && <div className="growth-ai-error"><b>I couldn’t answer that.</b><span>{error}</span><button onClick={() => void ask(lastFailed)}><RotateCcw size={12}/>Try again</button></div>}
      </div>
      <form onSubmit={submit}><label htmlFor="growth-ai-question">Ask about your results</label><div><input ref={input} id="growth-ai-question" value={question} onChange={event => setQuestion(event.target.value)} placeholder="Are our leads improving?" maxLength={500} autoComplete="off"/><button aria-label="Send question" disabled={!question.trim() || loading}><ArrowUp size={17}/></button></div><small><Sparkles size={11}/>Uses authorized dashboard data only</small></form>
    </aside>}
  </>;
}
