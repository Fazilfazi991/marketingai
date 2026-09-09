"use client";
import { useMemo, useState } from "react";
import {
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  Pencil,
  RotateCcw,
  Sparkles,
  X,
} from "lucide-react";
import {
  generateSocialMonth,
  regenerateSocialText,
  saveSocialContent,
} from "@/app/admin/content/actions";
import {
  addGeneratedSocialPlan,
  SocialPost,
  SocialStatus,
  updateSocialPost,
  useSocialPosts,
} from "@/lib/social-store";
import { DemoAIProvider } from "@/lib/ai/demo-provider";
import { prepareMonthlySocial } from "@/lib/ai/monthly-social";
import { Status } from "./ui";
const statuses: SocialStatus[] = [
  "Idea",
  "Generating",
  "Needs review",
  "Approved",
  "Ready for Design",
  "Poster Created",
  "Ready to schedule",
  "Scheduled",
  "Published",
  "Issue",
];
const monthLabel = (key: string) =>
  new Intl.DateTimeFormat("en", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${key}-01T00:00:00Z`));
const dbStatus: Record<SocialStatus, string> = {
  Idea: "idea",
  Generating: "generating",
  "Needs review": "needs_review",
  Approved: "approved",
  "Ready for Design": "ready_for_design",
  "Poster Created": "poster_created",
  "Ready to schedule": "ready_to_post",
  Scheduled: "scheduled",
  Published: "published",
  Issue: "issue",
};
type Props = {
  initial: SocialPost[];
  clients: Array<{ id: string; name: string }>;
  strategies: Array<{clientId:string;month:string;monthlyObjective:string;priorityTopics:string[];primaryCta:string;contentThemes:string[];contentMix:Record<string,number>;performanceObservations:string[];avoidRepeating:string[]}>;
  isDemo: boolean;
};

export function SocialOperations({ initial, clients, strategies, isDemo }: Props) {
  const demoPosts = useSocialPosts(),
    [livePosts, setLivePosts] = useState(initial),
    posts = isDemo ? demoPosts : livePosts;
  const [filter, setFilter] = useState("All statuses"),
    [platform, setPlatform] = useState("All platforms"),
    [editing, setEditing] = useState<SocialPost | null>(null),
    [month, setMonth] = useState(
      isDemo ? "2026-11" : new Date().toISOString().slice(0, 7),
    ),
    [clientId, setClientId] = useState(clients[0]?.id ?? ""),
    [assignedStaff,setAssignedStaff]=useState("All staff"),
    [demoStrategy,setDemoStrategy]=useState<Props["strategies"][number]|null>(null),
    [generating, setGenerating] = useState(false),
    [regenerating, setRegenerating] = useState<string | null>(null),
    [notice, setNotice] = useState("");
  const monthPosts = posts.filter(
      (post) =>
        post.month === monthLabel(month) &&
        (isDemo || post.clientId === clientId),
    ),
    visible = useMemo(
      () =>
        monthPosts.filter(
          (post) =>
            (filter === "All statuses" || post.status === filter) &&
            (platform === "All platforms" || post.platform.includes(platform)) && (assignedStaff==="All staff"||assignedStaff===(post.assignedStaff??"Unassigned")),
        ),
      [monthPosts, filter, platform,assignedStaff],
    );
  const counts = {
    review: monthPosts.filter((post) => post.status === "Needs review").length,
    ready: monthPosts.filter((post) => post.status === "Ready to schedule")
      .length,
    scheduled: monthPosts.filter((post) => post.status === "Scheduled").length,
    published: monthPosts.filter((post) => post.status === "Published").length,
  };
  const strategy=demoStrategy??strategies.find(item=>item.clientId===clientId&&item.month===month);
  const moveMonth = (direction: number) => {
    const date = new Date(`${month}-01T00:00:00Z`);
    date.setUTCMonth(date.getUTCMonth() + direction);
    setMonth(date.toISOString().slice(0, 7));
  };
  async function generate() {
    setGenerating(true);
    setNotice("");
    try {
      if (isDemo) {
        const result = await prepareMonthlySocial(
          new DemoAIProvider(),
          month,
          12,
        );
        addGeneratedSocialPlan(
          month,
          result.concepts,
          result.provider,
          result.model,
        );
        setDemoStrategy({clientId,month,monthlyObjective:result.strategy.monthlyObjective,priorityTopics:result.strategy.priorityTopics,primaryCta:result.strategy.primaryCta,contentThemes:result.strategy.contentThemes,contentMix:result.strategy.contentMix,performanceObservations:result.strategy.performanceObservations,avoidRepeating:result.strategy.avoidRepeating});
        setNotice(
          `12 posts prepared with ${result.model}. Demo image placeholders are ready for review.`,
        );
      } else {
        const result = await generateSocialMonth(clientId, month);
        if (!result.ok) throw new Error(result.error);
        setNotice(
          "Monthly social preparation completed and moved to internal review.",
        );
        window.location.reload();
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed";
      setNotice(message);
    } finally {
      setGenerating(false);
    }
  }
  async function save(post: SocialPost, next: SocialStatus) {
    if (isDemo) {
      updateSocialPost(
        post.id,
        { ...post, status: next },
        `Updated content · ${next}`,
      );
      setEditing(null);
      return;
    }
    const result = await saveSocialContent(post, dbStatus[next]);
    if (!result.ok) {
      setNotice(result.error);
      return;
    }
    setLivePosts((rows) =>
      rows.map((row) => (row.id === post.id ? { ...post, status: next } : row)),
    );
    setNotice(
      next === "Ready to schedule"
        ? "Approved and sent to the staff posting queue."
        : "Content changes saved.",
    );
    setEditing(null);
  }
  async function regenerate(post: SocialPost, mode:"brief"|"caption"|"poster_prompt") {
    if(isDemo){setNotice("Demo regeneration is preview-only; edit the field directly to test revisions.");return}
    setRegenerating(mode);const result=await regenerateSocialText(String(post.id),post.clientId??clientId,mode);
    if(!result.ok)setNotice(result.error);else{setLivePosts(rows=>rows.map(row=>row.id===post.id?{...row,...result.patch,history:[`Regenerated ${mode.replace("_"," ")} · human review required`,...row.history]}:row));setNotice(`Regenerated ${mode.replace("_"," ")} only; approved items were preserved.`)}setRegenerating(null);
  }
  return (
    <>
      {notice && (
        <div className="generation-notice">
          <Sparkles size={15} />
          <span>{notice}</span>
        </div>
      )}
      <div className="content-summary">
        <div>
          <span>Needs review</span>
          <b>{counts.review}</b>
        </div>
        <div>
          <span>Ready to schedule</span>
          <b>{counts.ready}</b>
        </div>
        <div>
          <span>Scheduled</span>
          <b>{counts.scheduled}</b>
        </div>
        <div>
          <span>Published</span>
          <b>{counts.published}</b>
        </div>
      </div>
      {strategy&&<section className="social-strategy-card"><span className="eyebrow">Monthly strategy</span><h2>{strategy.monthlyObjective}</h2><div className="strategy-grid"><div><b>Priority topics</b><p>{strategy.priorityTopics.join(" · ")}</p></div><div><b>Primary CTA</b><p>{strategy.primaryCta}</p></div><div><b>Content mix</b><p>{Object.entries(strategy.contentMix).map(([key,value])=>`${value} ${key}`).join(" · ")}</p></div><div><b>Performance observations</b><p>{strategy.performanceObservations.join(" ")}</p></div><div><b>Avoid repeating</b><p>{strategy.avoidRepeating.join(" · ")||"No recent repetition risks."}</p></div></div></section>}
      <div className="content-toolbar">
        <div className="month-switch">
          <button onClick={() => moveMonth(-1)} aria-label="Previous month">
            <ChevronLeft size={14} />
          </button>
          <b>
            <CalendarDays size={14} />
            {monthLabel(month)}
          </b>
          <button onClick={() => moveMonth(1)} aria-label="Next month">
            <ChevronRight size={14} />
          </button>
        </div>
        {!isDemo && (
          <select
            aria-label="Client filter"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
          >
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </select>
        )}
        <select
          value={platform}
          onChange={(event) => setPlatform(event.target.value)}
          aria-label="Platform filter"
        >
          <option>All platforms</option>
          <option>Instagram</option>
          <option>Facebook</option>
        </select>
        <select aria-label="Assigned staff filter" value={assignedStaff} onChange={event=>setAssignedStaff(event.target.value)}><option>All staff</option><option>Unassigned</option>{[...new Set(posts.map(post=>post.assignedStaff).filter(Boolean))].map(value=><option key={value!}>{value}</option>)}</select>
        <select
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="Status filter"
        >
          <option>All statuses</option>
          {statuses.map((status) => (
            <option key={status}>{status}</option>
          ))}
        </select>
        <button
          className="button generate-button"
          disabled={generating || !clientId || monthPosts.length > 0}
          onClick={generate}
        >
          <Sparkles size={13} />
          {generating ? "Preparing…" : monthPosts.length ? "Month prepared" : "Generate Monthly Social Plan"}
        </button>
      </div>
      {visible.length ? (
        <div className="social-grid">
          {visible.map((post) => (
            <article className="social-card" key={post.id}>
              <div
                className={`social-visual ${post.color} ${post.imageUrl ? "generated" : ""}`}
                style={
                  post.imageUrl
                    ? {
                        backgroundImage: `linear-gradient(#15241b22,#15241b99),url("${post.imageUrl}")`,
                      }
                    : undefined
                }
                role={post.imageUrl ? "img" : undefined}
                aria-label={
                  post.imageUrl
                    ? `Generated creative for ${post.topic}`
                    : undefined
                }
              >
                <span>{post.topic}</span>
                <small>{post.date}</small>
                <i>
                  <ImageIcon size={11} />
                  {post.imageStatus} v{post.imageVersion}
                </i>
              </div>
              <div className="social-card-body">
                <div className="social-card-top">
                  <span>{post.platform}</span>
                  <Status
                    tone={
                      post.status === "Needs review"
                        ? "warn"
                        : post.status === "Issue"
                          ? "risk"
                          : post.status === "Scheduled"
                            ? "purple"
                            : ""
                    }
                  >
                    {post.status}
                  </Status>
                </div>
                <h3>{post.topic}</h3>
                <p>{post.caption}</p>
                <div className="social-card-foot">
                  <span>{post.time}</span>
                  <button onClick={() => setEditing(post)}>
                    <Pencil size={12} />
                    Open
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="empty-state social-empty">
          <Sparkles />
          <b>No content prepared for {monthLabel(month)}</b>
          <p>
            Generate the configured social deliverables from the selected
            client’s verified business knowledge.
          </p>
          <button className="button" disabled={!clientId} onClick={generate}>
            Generate month
          </button>
        </div>
      )}
      {editing && (
        <Editor
          post={posts.find((post) => post.id === editing.id) ?? editing}
          close={() => setEditing(null)}
          save={save}
          regenerate={regenerate}
          regenerating={regenerating}
        />
      )}
    </>
  );
}

function Editor({
  post,
  close,
  save,
  regenerate,
  regenerating,
}: {
  post: SocialPost;
  close: () => void;
  save: (post: SocialPost, status: SocialStatus) => Promise<void>;
  regenerate: (post: SocialPost,mode:"brief"|"caption"|"poster_prompt") => Promise<void>;
  regenerating: string|null;
}) {
  const [draft, setDraft] = useState(post),
    [tab, setTab] = useState("Content");
  return (
    <div className="drawer-backdrop" onClick={close}>
      <aside
        className="editor-drawer"
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <span className="eyebrow">
              {post.client} · {post.date}
            </span>
            <h2>{post.topic}</h2>
          </div>
          <button
            className="ghost-icon"
            onClick={close}
            aria-label="Close editor"
          >
            <X size={19} />
          </button>
        </header>
        <div
          className={`editor-preview ${post.color} ${post.imageUrl ? "generated" : ""}`}
          style={
            post.imageUrl
              ? {
                  backgroundImage: `linear-gradient(#15241b22,#15241baa),url("${post.imageUrl}")`,
                }
              : undefined
          }
          role={post.imageUrl ? "img" : undefined}
          aria-label={
            post.imageUrl ? `Generated creative for ${post.topic}` : undefined
          }
        >
          <span>{post.topic}</span>
          <small>
            {post.imageStatus} creative · version {post.imageVersion}
          </small>
        </div>
        <div className="image-meta">
          <span>
            <b>Image model</b>
            {post.imageModel}
          </span>
          <span>
            <b>Storage</b>
            {post.storagePath ?? "No generated asset yet"}
          </span>
        </div>
        <div className="editor-tabs">
          <button
            className={tab === "Content" ? "active" : ""}
            onClick={() => setTab("Content")}
          >
            Content
          </button>
          <button
            className={tab === "History" ? "active" : ""}
            onClick={() => setTab("History")}
          >
            Activity
          </button>
        </div>
        {tab === "Content" ? (
          <div className="editor-form">
            <label>Objective<input value={draft.objective} onChange={event=>setDraft({...draft,objective:event.target.value})}/></label>
            <label>Poster headline<input value={draft.posterHeadline} onChange={event=>setDraft({...draft,posterHeadline:event.target.value})}/></label>
            <label>Supporting poster text<input value={draft.posterSupportingText} onChange={event=>setDraft({...draft,posterSupportingText:event.target.value})}/></label>
            <label>
              Post concept
              <textarea
                value={draft.concept}
                onChange={(event) =>
                  setDraft({ ...draft, concept: event.target.value })
                }
              />
            </label>
            <label>
              Caption
              <textarea
                className="caption-area"
                value={draft.caption}
                onChange={(event) =>
                  setDraft({ ...draft, caption: event.target.value })
                }
              />
            </label>
            <label>
              Hashtags
              <input
                value={draft.hashtags}
                onChange={(event) =>
                  setDraft({ ...draft, hashtags: event.target.value })
                }
              />
            </label>
            <label>
              Creative brief
              <textarea
                value={draft.creativeBrief}
                onChange={(event) =>
                  setDraft({ ...draft, creativeBrief: event.target.value })
                }
              />
            </label>
            <label>Copy-ready image prompt<textarea className="caption-area" value={draft.imagePrompt} onChange={event=>setDraft({...draft,imagePrompt:event.target.value})}/></label>
            <label>CTA<input value={draft.cta} onChange={event=>setDraft({...draft,cta:event.target.value})}/></label>
            <label>
              Internal notes
              <textarea
                value={draft.notes}
                onChange={(event) =>
                  setDraft({ ...draft, notes: event.target.value })
                }
              />
            </label>
          </div>
        ) : (
          <div className="history-list">
            {post.history.map((item, index) => (
              <div key={`${item}-${index}`}>
                <i />
                <span>
                  <b>{item}</b>
                  <small>Growth1000 · Partner</small>
                </span>
              </div>
            ))}
          </div>
        )}
        <footer>
          <button className="button secondary" disabled={Boolean(regenerating)} onClick={() => regenerate(post,"brief")}><RotateCcw size={13}/>{regenerating==="brief"?"Rewriting…":"Rewrite brief"}</button>
          <button className="button secondary" disabled={Boolean(regenerating)} onClick={() => regenerate(post,"caption")}><RotateCcw size={13}/>Caption only</button>
          <button className="button secondary" disabled={Boolean(regenerating)} onClick={() => regenerate(post,"poster_prompt")}><RotateCcw size={13}/>Poster prompt only</button>
          <span />
          <button
            className="button secondary"
            onClick={() => save(draft, draft.status)}
          >
            Save draft
          </button>
          {post.status === "Needs review" && (
            <button
              className="button"
              onClick={() => save(draft, "Ready for Design")}
            >
              <Check size={13} />
              Approve for design
            </button>
          )}
        </footer>
      </aside>
    </div>
  );
}
