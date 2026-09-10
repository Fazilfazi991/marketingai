"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type { ClientResultsData } from "@/lib/client-results";
import { resultHref } from "@/lib/result-consistency";
import { leadComparison, leadSourceLabel } from "@/lib/client-presentation";
import { ClientExecutiveOverview } from "./client-executive-overview";
import { ClientTrafficDetail } from "./client-traffic-detail";
import { ClientPageHeader } from "./client-page-header";
import { ClientMetricGrid } from "./client-metric-grid";
import {
  InteractiveSourceChart,
  InteractiveTrendChart,
} from "./interactive-results-charts";
import { Panel } from "./ui";

export function ClientResultsDashboard({
  data,
  view = "overview",
}: {
  data: ClientResultsData;
  view?: "overview" | "leads" | "traffic";
}) {
  const params = useSearchParams();
  const { leads } = data;
  if (view === "overview") return <ClientExecutiveOverview data={data} />;
  if (view === "traffic") return <ClientTrafficDetail data={data} />;
  const filtered = params.get("source");
  const sources =
    !filtered && !leads.sources.some((source) => source.key === "other")
      ? [
          ...leads.sources,
          {
            key: "other",
            label: "Other",
            value: Math.max(
              0,
              leads.total -
                leads.sources.reduce((sum, source) => sum + source.value, 0),
            ),
            tone: "sand",
            growth: null,
          },
        ]
      : leads.sources;
  return (
    <>
      <ClientPageHeader data={data} title="Leads" />
      {filtered && (
        <p className="client-filter-note">
          Showing{" "}
          {leads.sources.find((source) => source.key === filtered)?.label ??
            filtered}{" "}
          · <Link href={resultHref("/client/leads", data)}>All sources</Link>
        </p>
      )}
      <section className="client-lead-total" aria-label="Lead totals">
        <div>
          <strong>{leads.total.toLocaleString()}</strong>
          <span>Total enquiries</span>
        </div>
        <div>
          <b>
            {leads.qualified} qualified ·{" "}
            {Math.max(0, leads.total - leads.qualified)} general
          </b>
          <p>{leadComparison(leads)}</p>
        </div>
      </section>
      <section className="client-sources-section">
        <h2 className="client-section-title">Lead sources</h2>
        <ClientMetricGrid
          label="Lead source totals"
          items={sources.map((source) => ({
            label: leadSourceLabel(source.key, source.label),
            value: source.value,
            note: `${leads.total ? Math.round((source.value / leads.total) * 100) : 0}% of enquiries`,
            href: source.value
              ? resultHref("/client/leads", data, { source: source.key })
              : undefined,
          }))}
        />
        <div className="client-source-detail">
          <InteractiveSourceChart
            data={sources
              .filter((source) => source.value > 0)
              .map((source) => ({
                key: source.key,
                label: leadSourceLabel(source.key, source.label),
                value: source.value,
                share: leads.total
                  ? Math.round((source.value / leads.total) * 100)
                  : 0,
              }))}
          />
        </div>
      </section>
      {leads.trend.length > 0 && (
        <section className="client-leads-trend">
          <h2 className="client-section-title">Enquiry trend</h2>
          <InteractiveTrendChart
            key={`${data.rangeStart}:${data.rangeEnd}`}
            unit="Leads"
            height={100}
            data={leads.trend}
          />
        </section>
      )}
      <Panel
        title="Latest leads"
        meta="Most recent enquiries in this period"
        action={<></>}
      >
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
        </div>
      </Panel>
    </>
  );
}
