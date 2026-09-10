"use client";

import { Check, Download } from "lucide-react";
import { useState } from "react";
import type { ClientResultsData } from "@/lib/client-results";
import { ClientPageHeader } from "./client-page-header";
import { ClientMetricGrid } from "./client-metric-grid";
import { Panel } from "./ui";

export function ClientPortalSection({ data }: { data: ClientResultsData }) {
  const [selectedMonth, setSelectedMonth] = useState(
    data.report?.month ?? data.reports[0]?.month ?? "",
  );
  const report =
    data.reports.find((item) => item.month === selectedMonth) ??
    data.reports[0];
  return (
    <>
      <ClientPageHeader
        data={data}
        title="Reports"
        periodLabel={report?.monthLabel ?? data.periodLabel}
        control={
          report ? (
            <select
              aria-label="Report month"
              value={report.month}
              onChange={(event) => setSelectedMonth(event.target.value)}
            >
              {data.reports.map((item) => (
                <option key={item.month} value={item.month}>
                  {item.monthLabel}
                </option>
              ))}
            </select>
          ) : (
            <span>No reports</span>
          )
        }
      />
      {!report ? (
        <div className="client-report-empty">
          <h2>No published report yet</h2>
          <p>
            Your Growth1000 partner will publish verified growth summaries here
            when they are ready.
          </p>
        </div>
      ) : (
        <>
          <section className="client-report-hero">
            <header>
              <span>{data.isDemo ? "Demo report" : "Published report"}</span>
              <button
                type="button"
                className="client-pdf-action"
                aria-label="Print or save report as PDF"
                onClick={() => window.print()}
              >
                <Download size={16} />
                PDF
              </button>
            </header>
            <h2>Your monthly growth</h2>
            <p>{report.summary}</p>
          </section>
          <ClientMetricGrid
            label="Monthly report metrics"
            compactRow
            items={[
              { label: "Website users", value: report.users },
              { label: "Search clicks", value: report.clicks },
              { label: "Social posts", value: report.posts },
            ]}
          />
          <div className="client-report-sections">
            <Panel
              title="Work completed"
              meta={`${report.work.length} reported items`}
              action={<></>}
            >
              <div className="report-list">
                {report.work.length ? (
                  report.work.map((item) => (
                    <div key={item}>
                      <Check size={15} />
                      {item}
                    </div>
                  ))
                ) : (
                  <div>No completed work was included in this report.</div>
                )}
              </div>
            </Panel>
            <Panel title="Next month focus" action={<></>}>
              <div className="panel-body">
                <p className="report-copy">{report.nextFocus}</p>
              </div>
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
