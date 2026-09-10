"use client";
import { ArrowRight, Clock3 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import type { ClientResultsData } from "@/lib/client-results";
import { ClientExecutiveOverview } from "./client-executive-overview";
import { ClientTrafficDetail } from "./client-traffic-detail";
import { InteractiveTrendChart } from "./interactive-results-charts";
import { Panel } from "./ui";

export function ClientResultsDashboard({
  data,
  view = "overview",
}: {
  data: ClientResultsData;
  view?: "overview" | "leads" | "traffic";
}) {
  const router = useRouter(),
    pathname = usePathname();
  const [pending, startTransition] = useTransition();
  const { leads } = data;
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
      ? "No previous-period baseline"
      : `${value >= 0 ? "↑" : "↓"} ${Math.abs(value)}% vs previous period`;
  if (view === "overview") return <ClientExecutiveOverview data={data} />;
  if (view === "traffic") return <ClientTrafficDetail data={data} />;
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
      <section className="lead-hero">
        <div className="lead-hero-copy">
          <span>Tracked enquiries{data.isDemo ? " · Demo data" : ""}</span>
          <h2>
            <b>{leads.total}</b>Total leads
          </h2>
          <p>{growth(leads.growth)}</p>
          <small>
            {leads.qualified} qualified ·{" "}
            {Math.max(0, leads.total - leads.qualified)} general enquiries
          </small>
        </div>
        <div className="lead-hero-visual">
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
            key={data.rangeKey}
            tone="light"
            unit="Leads"
            height={112}
            data={leads.trend}
          />
        </div>
        <div className="lead-hero-sources">
          {leads.sources.slice(0, 3).map((source) => (
            <span key={source.key}>
              <small>{source.label}</small>
              <b>{source.value}</b>
            </span>
          ))}
        </div>
      </section>
      <div className="results-kpis">
        {leads.sources.map((source) => (
          <article key={source.key}>
            <span>{source.label}</span>
            <b>{source.value}</b>
            <small>{growth(source.growth)}</small>
          </article>
        ))}
      </div>
      <Panel action={null} title="Latest leads" meta="Most recent enquiries">
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
    </>
  );
}
