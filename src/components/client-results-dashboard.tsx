"use client";
import {
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Clock3,
  Lightbulb,
  MessageCircle,
  MessagesSquare,
  Target,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ClientResultsData } from "@/lib/client-results";
import { Panel } from "./ui";
import { GrowthAiAssistant } from "./growth-ai-assistant";
import { InteractiveSourceChart, InteractiveTrendChart } from "./interactive-results-charts";

export function ClientResultsDashboard({
  data,
  view = "overview",
}: {
  data: ClientResultsData;
  view?: "overview" | "leads" | "traffic";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const { leads, traffic, search, ai } = data,
    maxTrend = Math.max(...leads.trend.map((item) => item.value), 1);
  const periodNoun = data.rangeKey === "month" ? "this month" : "this period";
  const navigate = (
    range: string,
    from = data.rangeStart,
    to = data.rangeEnd,
  ) => {
    const query = new URLSearchParams({ range });
    if (range === "custom") {
      query.set("from", from);
      query.set("to", to);
    }
    startTransition(() => router.push(`${pathname}?${query.toString()}`));
  };
  const growthCopy = (value: number | null, comparison = "previous period") =>
    value === null
      ? "No previous-period baseline"
      : `${value >= 0 ? "↑" : "↓"} ${Math.abs(value)}% vs ${comparison}`;
  const leadBlock = (detailed = true) => (
    <>
      <div className="results-toolbar">
        <div>
          <b>{data.periodLabel}</b>
          <span>
            <Clock3 size={12} />
            {pending ? "Updating results…" : `Data updated ${data.updatedAt}`}
          </span>
        </div>
        <div>
          <label>
            Date range
            <select
              aria-label="Date range"
              value={data.rangeKey}
              disabled={pending}
              onChange={(event) => navigate(event.target.value)}
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="month">This month</option>
              <option value="last-month">Last month</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="year">This year</option>
              <option value="custom">Custom range</option>
            </select>
          </label>
          <label>
            Compare with
            <select aria-label="Comparison period" defaultValue="previous">
              <option value="previous">Previous period</option>
            </select>
          </label>
        </div>
      </div>
      {data.rangeKey === "custom" && (
        <div className="custom-range" aria-label="Custom date range">
          <label>
            From
            <input
              type="date"
              value={data.rangeStart}
              max={data.rangeEnd}
              disabled={pending}
              onChange={(event) =>
                navigate("custom", event.target.value, data.rangeEnd)
              }
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={data.rangeEnd}
              min={data.rangeStart}
              disabled={pending}
              onChange={(event) =>
                navigate("custom", data.rangeStart, event.target.value)
              }
            />
          </label>
        </div>
      )}
      <section className="lead-hero">
        <div className="lead-hero-copy">
          <span>Tracked enquiries{data.isDemo ? " · Demo data" : ""}</span>
          <h2>
            <b>{leads.total}</b>Total leads
          </h2>
          <p>{growthCopy(leads.growth)}</p>
          <small>
            {leads.qualified} qualified ·{" "}
            {Math.max(0, leads.total - leads.qualified)} general enquiries
          </small>
        </div>
        <div className="lead-hero-visual">
          <div className="hero-chart-head">
            <span>Lead trend</span>
            <div aria-label="Lead trend range">
              {["7d", "30d", "90d"].map((range) => (
                <button key={range} className={data.rangeKey === range ? "active" : ""} onClick={() => navigate(range)} disabled={pending}>{range.toUpperCase()}</button>
              ))}
            </div>
          </div>
          <InteractiveTrendChart key={`leads-${data.rangeKey}-${data.rangeStart}-${data.rangeEnd}`} tone="light" unit="Leads" height={112} data={leads.trend.map((item) => ({ label: item.label, value: item.value, ...(item.value === leads.total ? { qualified: leads.qualified, general: Math.max(0, leads.total - leads.qualified) } : {}) }))} />
        </div>
        <div className="lead-hero-sources">
          {leads.sources.slice(0, 3).map(source => <span key={source.key}><small>{source.label}</small><b>{source.value}</b></span>)}
        </div>
      </section>
      {detailed && <div className="results-kpis">
        {leads.sources.map((source) => (
          <article key={source.label}>
            <span>{source.label}</span>
            <b>{source.value}</b>
            <small
              className={
                source.growth !== null && source.growth < 0 ? "down" : ""
              }
            >
              {growthCopy(source.growth)}
            </small>
          </article>
        ))}
      </div>}
      {detailed && <div className="results-grid">
        <Panel title="Lead trend" meta="Leads by month">
          <div className="trend-switch">
            <b>Leads</b>
            <span>Qualified leads</span>
          </div>
          <div className="lead-trend">
            {leads.trend.map((item) => (
              <div key={item.label}>
                <i style={{ height: `${(item.value / maxTrend) * 100}%` }} />
                <b>{item.value}</b>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </Panel>
        <Panel
          title="Where your leads came from"
          meta="Count and verified share"
        >
          <div className="source-breakdown">
            {leads.sources.map((source) => (
              <div key={source.label}>
                <span>{source.label}</span>
                <i
                  className={source.tone}
                  style={{
                    width: `${leads.total ? (source.value / leads.total) * 100 : 0}%`,
                  }}
                />
                <b>
                  {source.value} ·{" "}
                  {leads.total
                    ? Math.round((source.value / leads.total) * 100)
                    : 0}
                  %
                </b>
              </div>
            ))}
          </div>
        </Panel>
      </div>}
    </>
  );
  const trafficBlock = (
    <>
      {!traffic.connected && <div className="empty-state"><b>Google Analytics not connected</b><p>Traffic results will appear after Growth1000 completes the first verified sync.</p></div>}
      {!search.connected && <div className="empty-state"><b>Search Console not connected</b><p>Google visibility results will appear after the property is connected and synced.</p></div>}
      <div className="results-kpis five">
        <article>
          <span>Website visitors</span>
          <b>{traffic.visitors.toLocaleString()}</b>
          <small>{growthCopy(traffic.growth)}</small>
        </article>
        <article>
          <span>New visitors</span>
          <b>{traffic.newVisitors.toLocaleString()}</b>
          <small>first-time visitors</small>
        </article>
        <article>
          <span>Page views</span>
          <b>{traffic.pageViews.toLocaleString()}</b>
          <small>across your website</small>
        </article>
        <article>
          <span>WhatsApp clicks</span>
          <b>{traffic.whatsappClicks.toLocaleString()}</b>
          <small>website CTA clicks</small>
        </article>
        <article>
          <span>Form submissions</span>
          <b>{traffic.formSubmissions}</b>
          <small>tracked enquiries</small>
        </article>
      </div>
      <div className="results-grid">
        <Panel title="Google growth" meta="Search performance that matters">
          <div className="google-stats">
            <div>
              <span>Organic clicks</span>
              <b>{search.clicks.toLocaleString()}</b>
            </div>
            <div>
              <span>Search impressions</span>
              <b>{search.impressions.toLocaleString()}</b>
            </div>
            <div>
              <span>Keywords improved</span>
              <b>{search.improved}</b>
            </div>
            <div>
              <span>Top 10 keywords</span>
              <b>{search.topTen}</b>
            </div>
          </div>
        </Panel>
        <Panel
          title="AI-generated leads"
          meta="Qualification before conversation volume"
        >
          <div className="ai-lead-total">
            <span>Qualified AI leads</span>
            <b>{ai.websiteLeads + ai.whatsappLeads}</b>
          </div>
          <div className="assistant-stats">
            <div>
              <MessageCircle size={17} />
              <span>Website AI leads</span>
              <b>{ai.websiteLeads}</b>
            </div>
            <div>
              <MessageCircle size={17} />
              <span>WhatsApp AI leads</span>
              <b>{ai.whatsappLeads}</b>
            </div>
            <div>
              <MessagesSquare size={17} />
              <span>Website conversations</span>
              <b>{ai.websiteConversations}</b>
            </div>
            <div>
              <MessagesSquare size={17} />
              <span>WhatsApp conversations</span>
              <b>{ai.whatsappConversations}</b>
            </div>
          </div>
        </Panel>
      </div>
      <Panel title="Keyword movement" meta="Selected Google rankings">
        <div className="keyword-table">
          <div>
            <span>Keyword</span>
            <span>Previous</span>
            <span>Current</span>
          </div>
          {search.keywords.length ? (
            search.keywords.map((item) => (
              <div key={item.keyword}>
                <b>{item.keyword}</b>
                <span>{item.previous}</span>
                <strong>
                  {item.current} {item.current < item.previous ? "↑" : ""}
                </strong>
              </div>
            ))
          ) : (
            <div>
              <b>No ranking data yet</b>
              <span>—</span>
              <strong>—</strong>
            </div>
          )}
        </div>
      </Panel>
    </>
  );
  const latest = (
    <Panel title="Latest leads" meta="Most recent enquiries">
      <div className="latest-leads">
        {leads.latest.length ? (
          leads.latest.map((item) => (
            <div key={item.id}>
              <span>
                <b>{item.name}</b>
                <small>{item.service}</small>
              </span>
              <span>{item.source}</span>
              <time>{item.createdAt}</time>
            </div>
          ))
        ) : (
          <p>No enquiries have been tracked in this period.</p>
        )}
        <Link href="/client/leads">
          View all leads <ArrowRight size={13} />
        </Link>
      </div>
    </Panel>
  );
  if (view === "leads")
    return (
      <>
        {leadBlock()}
        {latest}
      </>
    );
  if (view === "traffic") return trafficBlock;
  const insights = [
    `${leads.sources.slice().sort((a, b) => b.value - a.value)[0]?.label ?? "Your leading channel"} generated the most enquiries.`,
    traffic.growth === null
      ? "Traffic comparison will appear when a previous period is available."
      : `Organic website traffic ${traffic.growth >= 0 ? "increased" : "decreased"} ${Math.abs(traffic.growth)}%.`,
    search.keywords[0]
      ? `${search.keywords[0].keyword} moved from ${search.keywords[0].previous} to ${search.keywords[0].current}.`
      : "Keyword movement will appear after Search Console data is connected.",
  ];
  return (
    <>
      {leadBlock(false)}
      <section className="insights-strip">
        <Lightbulb size={19} />
        <div>
            <b>What’s happening {periodNoun}</b>
          {insights.map((item) => (
            <p key={item}>{item}</p>
          ))}
        </div>
      </section>
      <div className="lead-insights-grid">
        <Panel title="Lead sources" meta="Verified share of tracked enquiries">
          <InteractiveSourceChart data={leads.sources.filter((source) => source.value > 0).map((source) => ({ key: source.key, label: source.label, value: source.value, share: leads.total ? Math.round(source.value / leads.total * 100) : 0 }))} />
        </Panel>
        {latest}
      </div>
      <section className="results-section-head">
        <div>
          <h2>Performance snapshot</h2>
          <p>How visibility turns into measurable enquiries.</p>
        </div>
        <b>
          {traffic.visitors
            ? `${((traffic.formSubmissions / traffic.visitors) * 100).toFixed(1)}% visitor → form conversion`
            : "Conversion pending"}
        </b>
      </section>
      <div className="performance-snapshot">
        <Panel title="Website performance" meta="Traffic and conversion">
          <div className="compact-metrics">
            <div><span>Visitors</span><b>{traffic.visitors.toLocaleString()}</b></div>
            <div><span>New visitors</span><b>{traffic.newVisitors.toLocaleString()}</b></div>
            <div><span>Page views</span><b>{traffic.pageViews.toLocaleString()}</b></div>
            <div><span>WhatsApp clicks</span><b>{traffic.whatsappClicks.toLocaleString()}</b></div>
            <div><span>Form submissions</span><b>{traffic.formSubmissions}</b></div>
            <div><span>Conversion</span><b>{traffic.visitors ? `${((traffic.formSubmissions / traffic.visitors) * 100).toFixed(1)}%` : "—"}</b></div>
          </div>
          <div className="snapshot-chart">
            <span>Visitor trend</span>
            {traffic.trend?.length ? <InteractiveTrendChart key={`visitors-${data.rangeKey}`} unit="Visitors" height={82} data={traffic.trend} /> : <p>No daily analytics data available yet.</p>}
          </div>
        </Panel>
        <Panel title="Google growth" meta="Organic visibility">
          <div className="compact-metrics google-compact">
            <div><span>Organic clicks</span><b>{search.clicks.toLocaleString()}</b></div>
            <div><span>Impressions</span><b>{search.impressions.toLocaleString()}</b></div>
            <div><span>Keywords improved</span><b>{search.improved}</b></div>
            <div><span>Top 10 keywords</span><b>{search.topTen}</b></div>
          </div>
          <div className="snapshot-chart">
            <span>Organic click trend</span>
            {search.trend?.length ? <InteractiveTrendChart key={`clicks-${data.rangeKey}`} unit="Organic clicks" height={82} data={search.trend} /> : <p>No daily Search Console data available yet.</p>}
          </div>
        </Panel>
        <Panel title="AI-generated leads" meta="Qualified conversations">
          <div className="ai-summary-total"><span>Qualified AI leads</span><b>{ai.websiteLeads + ai.whatsappLeads}</b></div>
          <div className="compact-metrics ai-compact">
            <div><span>Website leads</span><b>{ai.websiteLeads}</b></div>
            <div><span>WhatsApp leads</span><b>{ai.whatsappLeads}</b></div>
            <div><span>Web conversations</span><b>{ai.websiteConversations}</b></div>
            <div><span>WA conversations</span><b>{ai.whatsappConversations}</b></div>
          </div>
        </Panel>
      </div>
      <Panel title="Keyword movement" meta="Selected Google rankings">
        <div className="keyword-table">
          <div><span>Keyword</span><span>Previous</span><span>Current</span></div>
          {search.keywords.length ? search.keywords.map((item) => <div key={item.keyword}><b>{item.keyword}</b><span>{item.previous}</span><strong>{item.current} {item.current < item.previous ? "↑" : ""}</strong></div>) : <div><b>No ranking data yet</b><span>—</span><strong>—</strong></div>}
        </div>
      </Panel>
      {data.topPages.length > 0 && (
        <Panel
          title="Top performing pages"
          meta="Visitors and attributable leads"
        >
          <div className="top-pages">
            <div>
              <span>Page</span>
              <span>Visitors</span>
              <span>Leads</span>
            </div>
            {data.topPages.map((item) => (
              <div key={item.page}>
                <b>{item.page}</b>
                <span>{item.visitors.toLocaleString()}</span>
                <strong>{item.leads}</strong>
              </div>
            ))}
          </div>
        </Panel>
      )}
      <div className="results-grid result-followup">
        <Panel
          title="Biggest SEO opportunities"
          meta="Closest growth opportunities"
        >
          <div className="opportunity-list">
            {data.opportunities.length ? (
              data.opportunities.map((item) => (
                <div key={item.keyword}>
                  <Target size={16} />
                  <span>
                    <b>{item.keyword}</b>
                    <small>
                      Position {item.position} · {item.note}
                    </small>
                  </span>
                </div>
              ))
            ) : (
              <p>No verified opportunities are available yet.</p>
            )}
          </div>
        </Panel>
        <Panel title="Next focus" meta="What Growth1000 is prioritising">
          <div className="next-focus">
            {data.nextFocus.length ? (
              data.nextFocus.map((item) => (
                <div key={item}>
                  <ArrowRight size={14} />
                  <span>{item}</span>
                </div>
              ))
            ) : (
              <p>Your next focus will appear after the monthly review.</p>
            )}
          </div>
        </Panel>
      </div>
      <Panel title={`Work completed ${periodNoun}`} meta="What Growth1000 delivered">
        <div className="work-completed">
          {data.work.length ? (
            data.work.map((item) => (
              <span key={item}>
                <CheckCircle2 size={15} />
                {item}
              </span>
            ))
          ) : (
            <span>No completed work has been published yet.</span>
          )}
        </div>
      </Panel>
      <section className="monthly-summary">
        <BarChart3 size={19} />
        <div>
          <b>{data.periodLabel} at a glance</b>
          <strong>
            {leads.total} leads · {growthCopy(leads.growth)} · Organic traffic{" "}
            {growthCopy(traffic.growth)}
          </strong>
          <p>{data.summary}</p>
        </div>
      </section>
      <GrowthAiAssistant key={`${data.rangeKey}:${data.rangeStart}:${data.rangeEnd}`} data={data} />
    </>
  );
}
