"use client";

import { useId, useState } from "react";
import {
  Area,
  AreaChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type TrendDatum = {
  label: string;
  value: number;
  qualified?: number;
  general?: number;
};

function ChartTooltip({
  active,
  payload,
  label,
  unit,
}: {
  active?: boolean;
  payload?: Array<{ value?: number; payload?: TrendDatum }>;
  label?: string;
  unit: string;
}) {
  const point = payload?.[0]?.payload;
  if (!active || !point) return null;
  return (
    <div className="results-chart-tooltip">
      <b>{label}</b>
      <span>
        <small>{unit}</small>
        <strong>{Number(payload?.[0]?.value ?? 0).toLocaleString()}</strong>
      </span>
      {point.qualified !== undefined && (
        <span>
          <small>Qualified</small>
          <strong>{point.qualified}</strong>
        </span>
      )}
      {point.general !== undefined && (
        <span>
          <small>General</small>
          <strong>{point.general}</strong>
        </span>
      )}
    </div>
  );
}

function ActiveDetail({
  point,
  unit,
}: {
  point: TrendDatum | undefined;
  unit: string;
}) {
  if (!point) return null;
  return (
    <div className="chart-active-detail" aria-live="polite">
      <b>{point.label}</b>
      <span>
        {point.value.toLocaleString()} {unit.toLowerCase()}
      </span>
      {point.qualified !== undefined && (
        <small>
          {point.qualified} qualified · {point.general ?? 0} general
        </small>
      )}
    </div>
  );
}

export function InteractiveTrendChart({
  data,
  unit,
  tone = "dark",
  height = 110,
}: {
  data: TrendDatum[];
  unit: string;
  tone?: "light" | "dark";
  height?: number;
}) {
  const [selected, setSelected] = useState(Math.max(0, data.length - 1));
  const gradientId = useId().replaceAll(":", "");
  const active = data[selected] ?? data.at(-1);
  return (
    <div className={`interactive-trend-chart ${tone}`}>
      <div className="chart-stage" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={data}
            margin={{ top: 12, right: 10, left: 10, bottom: 2 }}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity=".32" />
                <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              interval="preserveStartEnd"
              tick={{ fill: "currentColor", fontSize: 9, fontWeight: 700 }}
            />
            <YAxis hide domain={[0, "dataMax + 1"]} />
            <Tooltip
              cursor={{ stroke: "currentColor", strokeOpacity: 0.22 }}
              content={<ChartTooltip unit={unit} />}
              wrapperStyle={{ outline: "none", zIndex: 5 }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="currentColor"
              strokeWidth={2.2}
              fill={`url(#${gradientId})`}
              isAnimationActive
              animationDuration={420}
              activeDot={{ r: 6, strokeWidth: 3 }}
              dot={(props) => {
                const { cx = 0, cy = 0, index = 0 } = props;
                const isSelected = index === selected;
                return (
                  <g
                    key={`point-${index}`}
                    className="chart-point"
                    aria-hidden="true"
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isSelected ? 5 : 3}
                      className={isSelected ? "selected" : ""}
                    />
                  </g>
                );
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
        <div
          className="chart-touch-targets"
          aria-label={`${unit} chart points`}
        >
          {data.map((point, index) => (
            <button
              type="button"
              key={`${point.label}-${index}`}
              style={{
                left:
                  data.length === 1
                    ? "50%"
                    : `${(index / (data.length - 1)) * 100}%`,
              }}
              aria-label={`Select ${point.label}: ${point.value.toLocaleString()} ${unit.toLowerCase()}`}
              aria-pressed={index === selected}
              onPointerEnter={() => setSelected(index)}
              onFocus={() => setSelected(index)}
              onClick={() => setSelected(index)}
            />
          ))}
        </div>
      </div>
      <ActiveDetail point={active} unit={unit} />
    </div>
  );
}

type SourceDatum = { key: string; label: string; value: number; share: number };
const sourceColors = ["#42b88b", "#8c84e8", "#74addc", "#d7a85b"];
export function InteractiveSourceChart({ data }: { data: SourceDatum[] }) {
  const [selected, setSelected] = useState(0);
  const active = data[selected] ?? data[0];
  return (
    <div className="source-visual interactive-source-chart">
      <div className="source-chart-wrap">
        <ResponsiveContainer width="100%" height={132}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius={38}
              outerRadius={58}
              paddingAngle={2}
              onClick={(_, index) => setSelected(index)}
              isAnimationActive
              animationDuration={380}
            >
              {data.map((item, index) => (
                <Cell
                  key={item.key}
                  fill={sourceColors[index % sourceColors.length]}
                  opacity={index === selected ? 1 : 0.58}
                  stroke={index === selected ? "#fff" : "transparent"}
                  strokeWidth={3}
                  className="source-segment"
                />
              ))}
            </Pie>
            <Tooltip
              content={({ active: open, payload }) => {
                const item = payload?.[0]?.payload as SourceDatum | undefined;
                return open && item ? (
                  <div className="results-chart-tooltip">
                    <b>{item.label}</b>
                    <span>
                      <small>Leads</small>
                      <strong>{item.value}</strong>
                    </span>
                    <span>
                      <small>Share</small>
                      <strong>{item.share}%</strong>
                    </span>
                  </div>
                ) : null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
        <span className="source-center" aria-live="polite">
          <b>{active?.value ?? 0}</b>
          <small>{active?.label ?? "No leads"}</small>
        </span>
      </div>
      <div className="source-legend">
        {data.map((source, index) => (
          <button
            type="button"
            key={source.key}
            className={index === selected ? "active" : ""}
            aria-pressed={index === selected}
            onClick={() => setSelected(index)}
          >
            <i
              style={{ background: sourceColors[index % sourceColors.length] }}
            />
            <span>{source.label}</span>
            <b>{source.share}%</b>
            <small>{source.value}</small>
          </button>
        ))}
      </div>
    </div>
  );
}
