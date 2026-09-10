"use client";
import { ArrowRight, CheckCircle2, Clock3, Target } from "lucide-react";
import { PendingLink as Link } from "./pending-link";
import { ResultsRetry } from "./results-feedback";
import { NotificationFeed } from "./client-notifications";
import { LazyAssistant } from "./lazy-assistant";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ClientResultsData } from "@/lib/client-results";

import {
  InteractiveSourceChart,
  InteractiveTrendChart,
} from "./interactive-results-charts";
type PerformanceTab = "traffic" | "google" | "leads" | "ai";

export function ClientExecutiveOverview({
  data,
  part = "all",
}: {
  data: ClientResultsData;
  part?: "all" | "primary" | "metrics" | "insights";
}) {
  const router = useRouter(),
    pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState<PerformanceTab>("traffic");
  const { leads, traffic, search, ai } = data;
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
    startTransition(() => router.push(`${pathname}?${query}`));
  };
  const growth = (value: number | null) =>
    value === null
      ? "No prior baseline"
      : `${value >= 0 ? "↑" : "↓"} ${Math.abs(value)}% vs previous period`;
  const declined = search.keywords.filter((i) => i.current > i.previous).length,
    stable = search.keywords.filter((i) => i.current === i.previous).length;
  const bestGain = search.keywords
      .filter((i) => i.current < i.previous)
      .sort((a, b) => b.previous - b.current - (a.previous - a.current))[0],
    focus = data.opportunities[0];
  const performance = {
    traffic: {
      label: "Website visitors",
      value: traffic.visitors,
      detail: growth(traffic.growth),
      unit: "Visitors",
      trend: traffic.trend ?? [],
    },
    google: {
      label: "Organic clicks",
      value: search.clicks,
      detail: `${search.impressions.toLocaleString()} search impressions`,
      unit: "Organic clicks",
      trend: search.trend ?? [],
    },
    leads: {
      label: "Total leads",
      value: leads.total,
      detail: growth(leads.growth),
      unit: "Leads",
      trend: leads.trend,
    },
    ai: {
      label: "Qualified AI leads",
      value: ai.websiteLeads + ai.whatsappLeads,
      detail: `${ai.websiteConversations + ai.whatsappConversations} conversations`,
      unit: "AI leads",
      trend: [],
    },
  }[tab];
  if (data.unavailableSources?.length)
    return (
      <>
        {(part === "all" || part === "primary") && (
          <>
            <NotificationFeed data={data} />
            <LazyAssistant data={data} />
          </>
        )}
        <ResultsRetry label="Some results in this section are temporarily unavailable. Other sections are still usable." />
      </>
    );
  return (
    <>
      {(part === "all" || part === "primary") && (
        <h2 className="client-name">{data.clientName}</h2>
      )}
      {(part === "all" || part === "primary") && (
        <>
          <div className="results-toolbar">
            <div>
              <b>{data.periodLabel}</b>
              <span>
                <Clock3 size={12} />
                {pending
                  ? "Updating results…"
                  : `Data updated ${data.updatedAt}`}
              </span>
            </div>
            <div>
              <label>
                Date range
                <select
                  aria-label="Date range"
                  value={data.rangeKey}
                  disabled={pending}
                  onChange={(e) => navigate(e.target.value)}
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
            </div>
          </div>
        </>
      )}
      {(part === "all" || part === "primary") && (
        <>
          {data.rangeKey === "custom" && (
            <div className="custom-range">
              <label>
                From
                <input
                  disabled={pending}
                  type="date"
                  value={data.rangeStart}
                  max={data.rangeEnd}
                  onChange={(e) =>
                    navigate("custom", e.target.value, data.rangeEnd)
                  }
                />
              </label>
              <label>
                To
                <input
                  disabled={pending}
                  type="date"
                  value={data.rangeEnd}
                  min={data.rangeStart}
                  onChange={(e) =>
                    navigate("custom", data.rangeStart, e.target.value)
                  }
                />
              </label>
            </div>
          )}
        </>
      )}
      {(part === "all" || part === "primary") && (
        <>
          <div className="executive-first">
            <section className="executive-lead-hero">
              <div className="executive-lead-copy">
                <span>
                  Tracked enquiries{data.isDemo ? " · Demo data" : ""}
                </span>
                <Link href="/client/leads">
                  <strong>{leads.total}</strong>
                  <b>Total leads</b>
                </Link>
                <p>{growth(leads.growth)}</p>
                <small>
                  {leads.qualified} qualified ·{" "}
                  {Math.max(0, leads.total - leads.qualified)} general
                </small>
              </div>
              <div className="executive-lead-chart">
                <div className="hero-chart-head">
                  <span>Lead trend</span>
                  <div>
                    {["7d", "30d", "90d"].map((range) => (
                      <button
                        type="button"
                        key={range}
                        className={data.rangeKey === range ? "active" : ""}
                        disabled={pending}
                        onClick={() => navigate(range)}
                      >
                        {range.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
                <InteractiveTrendChart
                  key={`hero-${data.rangeKey}`}
                  tone="light"
                  unit="Leads"
                  height={104}
                  data={leads.trend}
                />
              </div>
            </section>
            <aside className="executive-focus">
              <span>Next focus</span>
              <Target size={22} />
              <h2>
                {focus?.keyword ?? data.nextFocus[0] ?? "Monthly focus pending"}
              </h2>
              <p>
                {focus
                  ? `Position ${focus.position} · ${focus.note}`
                  : "Based on the latest published monthly review."}
              </p>
              {data.nextFocus.slice(0, 3).map((item) => (
                <small key={item}>{item}</small>
              ))}
              <Link href="/client/traffic?view=opportunities">
                View focus plan <ArrowRight size={14} />
              </Link>
            </aside>
          </div>
        </>
      )}
      {(part === "all" || part === "metrics") && (
        <>
          <section className="executive-performance">
            <header>
              <div>
                <span>Performance</span>
                <h2>{performance.label}</h2>
              </div>
              <div
                className="executive-tabs"
                role="tablist"
                aria-label="Performance metric"
              >
                {(["traffic", "google", "leads", "ai"] as PerformanceTab[]).map(
                  (item) => (
                    <button
                      key={item}
                      type="button"
                      role="tab"
                      aria-selected={tab === item}
                      className={tab === item ? "active" : ""}
                      onClick={() => setTab(item)}
                    >
                      {item === "ai"
                        ? "AI"
                        : item[0].toUpperCase() + item.slice(1)}
                    </button>
                  ),
                )}
              </div>
            </header>
            <div className="executive-performance-body">
              <div>
                <strong>{performance.value.toLocaleString()}</strong>
                <span>{performance.detail}</span>
              </div>
              {performance.trend.length ? (
                <InteractiveTrendChart
                  key={tab}
                  unit={performance.unit}
                  height={116}
                  showValue={false}
                  data={performance.trend}
                />
              ) : (
                <p className="executive-no-history">
                  {tab === "ai"
                    ? "AI history is not available yet. Current totals are shown."
                    : "No history is available for this period. Try another date range."}
                </p>
              )}
            </div>
          </section>
        </>
      )}
      {(part === "all" || part === "insights") && (
        <>
          <div className="executive-insights">
            <div className="executive-summary-grid">
              <Link href="/client/traffic?view=keywords">
                <span>Keyword movement</span>
                <strong>{search.improved} improved</strong>
                <p>
                  {declined} declined · {stable} stable
                </p>
                <small>
                  {bestGain
                    ? `Best gain: ${bestGain.keyword}`
                    : "No verified movement yet"}
                </small>
                <ArrowRight />
              </Link>
              <Link href="/client/traffic?view=pages">
                <span>Top pages</span>
                <strong>{data.topPages[0]?.page ?? "No page data yet"}</strong>
                {data.topPages.slice(0, 2).map((page) => (
                  <p key={page.page}>
                    {page.page}: {page.visitors.toLocaleString()} visitors ·{" "}
                    {page.leads} leads
                  </p>
                ))}
                <ArrowRight />
              </Link>
              <Link href="/client/traffic?view=opportunities">
                <span>SEO opportunities</span>
                <strong>{data.opportunities.length} verified</strong>
                <p>
                  {focus
                    ? `${focus.keyword} · position ${focus.position}`
                    : "No opportunities published yet"}
                </p>
                <ArrowRight />
              </Link>
            </div>
          </div>
        </>
      )}
      {(part === "all" || part === "insights") && (
        <>
          <div className="executive-bottom">
            <Link href="/client/reports">
              <span>Work completed</span>
              <strong>{data.work.length} published updates</strong>
              <div>
                {data.work.slice(0, 4).map((item) => (
                  <small key={item}>
                    <CheckCircle2 size={13} />
                    {item}
                  </small>
                ))}
              </div>
              <em>
                View reports <ArrowRight size={13} />
              </em>
            </Link>
            <Link href="/client/reports">
              <span>{data.periodLabel} summary</span>
              <strong>
                {leads.total} leads · {search.clicks.toLocaleString()} organic
                clicks
              </strong>
              <p>{data.summary}</p>
              <em>
                Open monthly report <ArrowRight size={13} />
              </em>
            </Link>
          </div>
        </>
      )}
      {(part === "all" || part === "primary") && (
        <>
          <NotificationFeed data={data} />
          <LazyAssistant data={data} />
        </>
      )}
    </>
  );
}

export function ClientSourceDonut({ data }: { data: ClientResultsData }) {
  if (data.unavailableSources?.includes("leads"))
    return <ResultsRetry label="Lead sources could not be loaded." />;
  const { leads } = data;
  return (
    <section className="executive-source">
      <header>
        <h2>Lead sources</h2>
        <span>Verified share</span>
      </header>
      <InteractiveSourceChart
        data={leads.sources
          .filter((s) => s.value > 0)
          .map((s) => ({
            key: s.key,
            label: s.label,
            value: s.value,
            share: leads.total ? Math.round((s.value / leads.total) * 100) : 0,
          }))}
      />
    </section>
  );
}
