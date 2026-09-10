import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
vi.mock("next/dynamic", () => ({
  default: () =>
    function Canvas() {
      return <div data-chart-canvas="true" />;
    },
}));
import {
  InteractiveSourceChart,
  InteractiveTrendChart,
} from "./interactive-results-charts";
describe("truthful sparse charts", () => {
  it("renders one genuine point compactly without loading a time-series canvas", () => {
    const html = renderToStaticMarkup(
      <InteractiveTrendChart
        unit="Visitors"
        data={[{ label: "Sep 8", value: 1842 }]}
      />,
    );
    expect(html).toContain("1,842");
    expect(html).toContain("Latest verified period: Sep 8");
    expect(html).not.toContain("data-chart-canvas");
  });
  it("does not invent a zero when there is no history", () => {
    const html = renderToStaticMarkup(
      <InteractiveTrendChart unit="Leads" data={[]} />,
    );
    expect(html).toContain("No verified history");
    expect(html).toContain("—");
    expect(html).not.toContain("data-chart-canvas");
  });
  it("ignores non-finite values instead of fabricating replacements", () => {
    const html = renderToStaticMarkup(
      <InteractiveTrendChart
        unit="Clicks"
        data={[
          { label: "A", value: NaN },
          { label: "B", value: 12 },
        ]}
      />,
    );
    expect(html).toContain("Latest verified period: B");
    expect(html).not.toContain("NaN");
  });
  it("uses the interactive canvas once at least two points exist", () => {
    expect(
      renderToStaticMarkup(
        <InteractiveTrendChart
          unit="Leads"
          data={[
            { label: "A", value: 1 },
            { label: "B", value: 2 },
          ]}
        />,
      ),
    ).toContain("data-chart-canvas");
  });
  it("shows an explicit empty source state", () => {
    expect(
      renderToStaticMarkup(<InteractiveSourceChart data={[]} />),
    ).toContain("No tracked lead sources");
  });
});
