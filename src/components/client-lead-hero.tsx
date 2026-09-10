"use client";
import Link from "next/link";
import type { ClientResultsData } from "@/lib/client-results";
import { resultHref } from "@/lib/result-consistency";
import { leadComparison, leadSourceLabel } from "@/lib/client-presentation";
import { useClientRange } from "./client-page-header";
import { InteractiveTrendChart } from "./interactive-results-charts";

export function ClientLeadHero({ data }: { data: ClientResultsData }) {
  const { leads } = data;
  const { pending, navigate } = useClientRange(data);
  return (
    <section className="client-lead-hero" aria-label="Lead results">
      <header className="client-lead-heading">
        <h2>
          {data.rangeKey === "month" ? "Leads this month" : "Leads this period"}
        </h2>
        <p className="client-lead-comparison">{leadComparison(leads)}</p>
      </header>
      <div className="client-lead-summary">
        <Link href={resultHref("/client/leads", data)}>
          <strong>{leads.total.toLocaleString()}</strong>
          <span>Total enquiries</span>
        </Link>
        <dl>
          <div>
            <dt>Qualified</dt>
            <dd>{leads.qualified}</dd>
          </div>
          <div>
            <dt>General</dt>
            <dd>{Math.max(0, leads.total - leads.qualified)}</dd>
          </div>
        </dl>
      </div>
      <div className="client-lead-trend">
        <div className="hero-chart-head">
          <span>Lead trend</span>
          <div>
            {["7d", "30d", "90d"].map((range) => (
              <button
                type="button"
                key={range}
                disabled={pending}
                aria-pressed={data.rangeKey === range}
                className={data.rangeKey === range ? "active" : ""}
                onClick={() => navigate(range)}
              >
                {range.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
        <InteractiveTrendChart
          key={`${data.rangeStart}:${data.rangeEnd}`}
          tone="light"
          unit="Leads"
          height={56}
          data={leads.trend}
        />
      </div>
      <nav className="client-source-chips" aria-label="Lead source filters">
        {leads.sources.map((source) => (
          <Link
            key={source.key}
            href={resultHref("/client/leads", data, { source: source.key })}
          >
            {leadSourceLabel(source.key, source.label)} <b>{source.value}</b>
          </Link>
        ))}
      </nav>
    </section>
  );
}
