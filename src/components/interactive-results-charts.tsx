"use client";
import dynamic from "next/dynamic";
const Trend = dynamic(
  () => import("./results-chart-canvas").then((m) => m.InteractiveTrendChart),
  {
    loading: () => (
      <div className="chart-loading" role="status">
        Loading chart…
      </div>
    ),
  },
);
const Sources = dynamic(
  () => import("./results-chart-canvas").then((m) => m.InteractiveSourceChart),
  {
    loading: () => (
      <div className="chart-loading" role="status">
        Loading sources…
      </div>
    ),
  },
);
type Point = {
  label: string;
  value: number;
  qualified?: number;
  general?: number;
};
export function InteractiveTrendChart(props: {
  data: Point[];
  unit: string;
  tone?: "light" | "dark";
  height?: number;
  showValue?: boolean;
}) {
  const points = props.data.filter((point) => Number.isFinite(point.value));
  if (points.length < 2)
    return (
      <div
        className={`single-period ${props.tone ?? "dark"} ${props.showValue === false ? "summary-only" : ""}`}
      >
        {props.showValue !== false && (
          <b>
            {points.length ? points[0].value.toLocaleString() : "—"}{" "}
            <small>{props.unit}</small>
          </b>
        )}
        <span>
          {points.length
            ? `Latest verified period: ${points[0].label}`
            : "No verified history for this period."}
        </span>
        <small>
          {points.length
            ? "A trend will appear when another verified period is available."
            : ""}
        </small>
      </div>
    );
  return <Trend {...props} data={points} />;
}
export function InteractiveSourceChart(props: {
  data: { key: string; label: string; value: number; share: number }[];
}) {
  if (!props.data.length)
    return (
      <p className="chart-empty">No tracked lead sources for this period.</p>
    );
  return <Sources {...props} />;
}
