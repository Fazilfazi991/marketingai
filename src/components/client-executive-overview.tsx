"use client";
import { ArrowRight, CheckCircle2, Clock3, Target } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { ClientResultsData } from "@/lib/client-results";
import {
  keywordCounts,
  keywordMovement,
  pageLabel,
  resultHref,
} from "@/lib/result-consistency";
import { GrowthAiAssistant } from "./growth-ai-assistant";
import {
  InteractiveSourceChart,
  InteractiveTrendChart,
} from "./interactive-results-charts";
type PerformanceTab = "traffic" | "google" | "leads" | "ai";

export function ClientExecutiveOverview({ data }: { data: ClientResultsData }) {
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
  const { improved, declined, stable } = keywordCounts(search.keywords);
  const detail = (view: string) =>
    resultHref("/client/traffic", data, { view });
  const bestGain = search.keywords
      .filter((i) => keywordMovement(i) === "Improved")
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
  return (
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
      {data.rangeKey === "custom" && (
        <div className="custom-range">
          <label>
            From
            <input
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
      <div className="executive-first">
        <section className="executive-lead-hero">
          <div className="executive-lead-copy">
            <span>Tracked enquiries{data.isDemo ? " · Demo data" : ""}</span>
            <Link href={resultHref("/client/leads", data)}>
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
                    disabled={pending}
                    className={data.rangeKey === range ? "active" : ""}
                    onClick={() => navigate(range)}
                  >
                    {range.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
            <InteractiveTrendChart
              key={`hero-${data.rangeStart}-${data.rangeEnd}`}
              tone="light"
              unit="Leads"
              height={80}
              data={leads.trend}
            />
          </div>
          <nav className="hero-source-actions" aria-label="Lead source filters">
            {leads.sources
              .filter((source) => source.key !== "other" || source.value > 0)
              .map((source) => (
                <Link
                  key={source.key}
                  href={resultHref("/client/leads", data, {
                    source: source.key,
                  })}
                >
                  {source.label.replace(" chatbot", "")} <b>{source.value}</b>
                </Link>
              ))}
          </nav>
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
          <Link href={detail("opportunities")}>
            View focus plan <ArrowRight size={14} />
          </Link>
        </aside>
      </div>
      <section className="executive-performance">
        <header>
          <div>
            <span>Performance</span>
            <h2>{performance.label}</h2>
          </div>
          <div className="executive-tabs" role="tablist">
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
                  {item === "google"
                    ? "Google"
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
          <InteractiveTrendChart
            key={`${tab}-${data.rangeStart}-${data.rangeEnd}`}
            unit={performance.unit}
            height={116}
            data={performance.trend}
          />
        </div>
      </section>
      <div className="executive-insights">
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
                share: leads.total
                  ? Math.round((s.value / leads.total) * 100)
                  : 0,
              }))}
          />
        </section>
        <div className="executive-summary-grid">
          <Link href={detail("keywords")}>
            <span>Keyword movement</span>
            <strong>{improved} improved</strong>
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
          <Link href={detail("pages")}>
            <span>Top pages</span>
            <strong>
              {data.topPages.length
                ? `${data.topPages.length} measured pages`
                : "No page data yet"}
            </strong>
            {data.topPages.slice(0, 2).map((page) => (
              <p key={page.page}>
                <b>{pageLabel(page.page)}</b>
                <br />
                {page.visitors.toLocaleString()} visitors · {page.leads} leads
              </p>
            ))}
            <ArrowRight />
          </Link>
          <Link href={detail("opportunities")}>
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
      <div className="executive-bottom">
        <Link href={resultHref("/client/reports", data)}>
          <span>
            Work completed ·{" "}
            {data.report?.monthLabel ?? "No report for this month"}
          </span>
          <strong>{data.report?.work.length ?? 0} reported work items</strong>
          <div>
            {(data.report?.work ?? []).slice(0, 4).map((item) => (
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
        <Link href={resultHref("/client/reports", data)}>
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
      <GrowthAiAssistant
        key={`${data.rangeKey}:${data.rangeStart}:${data.rangeEnd}`}
        data={data}
      />
    </>
  );
}
