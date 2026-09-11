"use client";
import { useContext, useState, type ReactNode } from "react";
import { CalendarDays, ChartNoAxesCombined } from "lucide-react";
import { useClientRange } from "./client-page-header";
import { ClientRangeContext } from "./client-range-state";
import { InteractiveTrendChart } from "./interactive-results-charts";
import type { ClientResultsData } from "@/lib/client-results";

type HeaderData = Pick<
  ClientResultsData,
  | "clientName"
  | "periodLabel"
  | "rangeKey"
  | "rangeStart"
  | "rangeEnd"
  | "updatedAt"
  | "isDemo"
>;
export function TodaySurface({ children }: { children: ReactNode }) {
  const range = useContext(ClientRangeContext);
  return (
    <div className="today-dashboard" aria-busy={range?.pending ?? false}>
      {children}
    </div>
  );
}
export function TodayHeader({ data }: { data: HeaderData }) {
  const { pending, navigate, selectedRange } = useClientRange(data);
  return (
    <header className="today-header" data-results-range={data.rangeKey}>
      <div>
        <div className="today-title">
          <h1>Today</h1>
          {data.isDemo && <span className="today-demo">Demo</span>}
        </div>
        <p>{data.clientName}</p>
      </div>
      <div className="today-date">
        <label>
          <CalendarDays size={16} />
          <select
            aria-label="Date range"
            value={selectedRange}
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
        <span role="status">
          {pending ? "Updating results…" : data.periodLabel}
        </span>
      </div>
      {data.rangeKey === "custom" && (
        <div className="today-custom-dates">
          <label>
            From
            <input
              aria-label="From date"
              type="date"
              value={data.rangeStart}
              max={data.rangeEnd}
              disabled={pending}
              onChange={(event) =>
                event.target.value &&
                navigate("custom", event.target.value, data.rangeEnd)
              }
            />
          </label>
          <label>
            To
            <input
              aria-label="To date"
              type="date"
              value={data.rangeEnd}
              min={data.rangeStart}
              disabled={pending}
              onChange={(event) =>
                event.target.value &&
                navigate("custom", data.rangeStart, event.target.value)
              }
            />
          </label>
        </div>
      )}
    </header>
  );
}

type Point = { label: string; value: number };
export function GrowthOverview({
  traffic,
  google,
  period,
  enquiries,
}: {
  traffic: Point[];
  google: Point[];
  period: string;
  enquiries: number;
}) {
  const [selection, setSelection] = useState<
    "traffic" | "google" | "enquiries"
  >(traffic.length >= 2 ? "traffic" : google.length ? "google" : "enquiries");
  const points =
    selection === "traffic" ? traffic : selection === "google" ? google : [];
  const unit = selection === "traffic" ? "Visitors" : "Organic clicks";
  const latest = points.at(-1),
    previous = points.at(-2);
  const delta =
    latest && previous && previous.value > 0
      ? Math.round(((latest.value - previous.value) / previous.value) * 100)
      : null;
  return (
    <section
      className="today-overview today-card"
      aria-labelledby="today-overview-title"
    >
      <div className="today-section-heading">
        <h2 id="today-overview-title">Growth Overview</h2>
        <ChartNoAxesCombined size={18} />
      </div>
      <div className="today-chart-tabs" role="group" aria-label="Growth metric">
        {(["traffic", "google", "enquiries"] as const).map((tab) => (
          <button
            type="button"
            key={tab}
            aria-pressed={selection === tab}
            onClick={() => setSelection(tab)}
          >
            {tab === "traffic"
              ? "Traffic"
              : tab === "google"
                ? "Google"
                : "Enquiries"}
          </button>
        ))}
      </div>
      <div className="today-chart" aria-live="polite">
        {points.length ? (
          <>
            <div className="today-chart-summary">
              <strong>{latest?.value.toLocaleString("en")}</strong>
              <span>
                {unit.toLowerCase()} · {latest?.label}
              </span>
            </div>
            <InteractiveTrendChart
              key={selection}
              data={points}
              unit={unit}
              tone="light"
              height={110}
              granularity="month"
            />
            <p className="today-chart-insight">
              {delta === null
                ? "More published history is needed for a comparison."
                : `${unit} ${delta === 0 ? "held steady" : `${delta > 0 ? "increased" : "decreased"} ${Math.abs(delta)}%`} between ${previous?.label} and ${latest?.label}.`}
            </p>
          </>
        ) : (
          <div className="today-chart-empty">
            <ChartNoAxesCombined size={26} />
            <h3>
              {selection === "enquiries"
                ? `${enquiries.toLocaleString("en")} enquiries this period`
                : "Your trend will appear here"}
            </h3>
            <p>
              {selection === "enquiries"
                ? "Monthly enquiry history is not included in the available reports."
                : "There is not enough published report history for this metric yet."}
            </p>
            <span>{period}</span>
          </div>
        )}
      </div>
      <p className="today-chart-source">
        Published monthly reports · missing months are not filled
      </p>
    </section>
  );
}
