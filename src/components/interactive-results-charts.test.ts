import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { InteractiveTrendChart } from "./interactive-results-charts";

it("does not draw a chart for zero points", () => {
  const html = renderToStaticMarkup(
    createElement(InteractiveTrendChart, { data: [], unit: "Visitors" }),
  );
  expect(html).toContain("No dated");
  expect(html).not.toContain("chart-stage");
});
it("renders a compact single-day value rather than a fabricated trend", () => {
  const html = renderToStaticMarkup(
    createElement(InteractiveTrendChart, {
      data: [{ label: "2026-09-25", value: 20 }],
      unit: "Visitors",
    }),
  );
  expect(html).toContain("Sep 25");
  expect(html).toContain("One recorded day");
  expect(html).not.toContain("chart-stage");
});
it("renders the chart and date-labelled controls for two genuine points", () => {
  const html = renderToStaticMarkup(
    createElement(InteractiveTrendChart, {
      data: [
        { label: "2026-09-25", value: 20 },
        { label: "2026-09-30", value: 30 },
      ],
      unit: "Visitors",
    }),
  );
  expect(html).toContain("chart-stage");
  expect(html).toContain("Select 2026-09-25: 20 visitors");
  expect(html).toContain("Select 2026-09-30: 30 visitors");
});
it("describes a single published report as a month, not a day", () => {
  const html = renderToStaticMarkup(
    createElement(InteractiveTrendChart, {
      data: [{ label: "September 2026", value: 684 }],
      unit: "Organic clicks",
      granularity: "month",
    }),
  );
  expect(html).toContain("One recorded month");
  expect(html).not.toContain("One recorded day");
  expect(html).not.toContain("chart-stage");
});
