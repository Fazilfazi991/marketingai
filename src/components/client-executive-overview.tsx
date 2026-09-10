"use client";
import { ArrowRight, CheckCircle2, Target } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { ClientResultsData } from "@/lib/client-results";
import { leadComparison } from "@/lib/client-presentation";
import {
  keywordCounts,
  keywordMovement,
  pageLabel,
  resultHref,
} from "@/lib/result-consistency";
import { GrowthAiAssistant } from "./growth-ai-assistant";
import { ClientPageHeader } from "./client-page-header";
import { ClientLeadHero } from "./client-lead-hero";
import {
  InteractiveSourceChart,
  InteractiveTrendChart,
} from "./interactive-results-charts";
type PerformanceTab = "traffic" | "google" | "leads" | "ai";

export function ClientExecutiveOverview({ data }: { data: ClientResultsData }) {
  const [tab, setTab] = useState<PerformanceTab>("traffic");
  const { leads, traffic, search, ai } = data;
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
      detail: leadComparison(leads),
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
      <ClientPageHeader data={data} title={data.clientName} overview />
      <div className="executive-first">
        <ClientLeadHero data={data} />
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
