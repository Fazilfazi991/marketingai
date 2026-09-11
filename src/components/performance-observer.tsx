"use client";

import { useEffect } from "react";

/** Opt-in, local browser diagnostics. No telemetry is transmitted. */
export function PerformanceObserverClient() {
  useEffect(() => {
    const hydrated = performance.now();
    if (new URLSearchParams(location.search).get("perf") !== "1") return;
    const output = document.createElement("output");
    output.hidden = true;
    output.id = "growth-performance";
    document.body.append(output);
    const actions: Array<{ kind: string; nextPaintMs: number }> = [];
    const sections: Record<string, number> = {};
    const navigations: Array<{ path: string; ms: number }> = [];
    let route: { path: string; start: number } | undefined;
    let loginStarted: number | undefined;
    let loginReadyMs: number | undefined;
    let rangeStarted: { range: string; start: number } | undefined;
    const ranges: Array<{ range: string; ms: number }> = [];
    const submit = (event: Event) => {
      if (
        (event.target as HTMLFormElement)?.querySelector(
          'input[type="password"]',
        )
      )
        loginStarted = performance.now();
    };
    document.addEventListener("submit", submit, true);
    const click = (event: Event) => {
      const target = (event.target as Element)?.closest("button,a,select");
      if (!target) return;
      const start = performance.now();
      if (target.closest(".hero-chart-head") && target.tagName === "BUTTON")
        rangeStarted = {
          range: target.textContent?.trim().toLowerCase() ?? "",
          start,
        };
      const kind =
        target.getAttribute("role") === "tab"
          ? "metric-tab"
          : target.closest(".client-notifications")
            ? "notification"
            : target.closest(".growth-ai-panel")
              ? "assistant-action"
              : target.classList.contains("growth-ai-launcher")
                ? "assistant-open"
                : target.tagName === "A"
                  ? "navigation"
                  : "control";
      const href = target.getAttribute("href");
      if (href?.startsWith("/client"))
        route = { path: new URL(href, location.origin).pathname, start };
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          actions.push({
            kind,
            nextPaintMs: Math.round(performance.now() - start),
          });
          if (actions.length > 30) actions.shift();
        }),
      );
    };
    document.addEventListener("click", click, true);
    const scan = () => {
      const header = document.querySelector(".client-page-header");
      if (
        rangeStarted &&
        header?.getAttribute("data-results-range") === rangeStarted.range &&
        header.getAttribute("aria-busy") === "false"
      ) {
        ranges.push({
          range: rangeStarted.range,
          ms: Math.round(performance.now() - rangeStarted.start),
        });
        rangeStarted = undefined;
      }
      if (
        loginStarted &&
        loginReadyMs === undefined &&
        document.querySelector(".client-lead-hero")
      )
        loginReadyMs = Math.round(performance.now() - loginStarted);
      for (const [name, selector] of Object.entries({
        primary: ".client-lead-hero",
        performance: ".executive-performance",
        insights: ".executive-insights",
      })) {
        if (!sections[name] && document.querySelector(selector))
          sections[name] = Math.round(performance.now());
      }
      if (
        route &&
        location.pathname === route.path &&
        !document.querySelector(".results-skeleton")
      ) {
        navigations.push({
          path: route.path,
          ms: Math.round(performance.now() - route.start),
        });
        route = undefined;
        if (navigations.length > 20) navigations.shift();
      }
    };
    const sample = () => {
      const nav = performance.getEntriesByType("navigation")[0] as
        PerformanceNavigationTiming | undefined;
      const resources = performance.getEntriesByType(
        "resource",
      ) as PerformanceResourceTiming[];
      scan();
      output.textContent = JSON.stringify({
        hydratedMs: Math.round(hydrated),
        ttfbMs: Math.round(nav?.responseStart ?? 0),
        documentMs: Math.round(nav?.responseEnd ?? 0),
        scriptBytes: resources
          .filter((r) => r.initiatorType === "script")
          .reduce((n, r) => n + r.encodedBodySize, 0),
        requests: resources.length,
        apiRequests: resources.filter((r) =>
          new URL(r.name).pathname.startsWith("/api/"),
        ).length,
        serverComponentRequests: resources.filter((r) =>
          new URL(r.name).searchParams.has("_rsc"),
        ).length,
        loginReadyMs,
        paints: performance
          .getEntriesByType("paint")
          .map((p) => ({ name: p.name, ms: Math.round(p.startTime) })),
        sections,
        actions,
        navigations,
        ranges,
      });
    };
    sample();
    const timer = setInterval(sample, 1000);
    const observer = new MutationObserver(scan);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["aria-busy", "data-results-range"],
    });
    return () => {
      clearInterval(timer);
      observer.disconnect();
      document.removeEventListener("click", click, true);
      document.removeEventListener("submit", submit, true);
      output.remove();
    };
  }, []);
  return null;
}
