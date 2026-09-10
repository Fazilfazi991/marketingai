"use client";

import { useEffect } from 'react';

/** Opt-in, local browser diagnostics. No telemetry is transmitted. */
export function PerformanceObserverClient() {
  useEffect(() => {
    const hydrated = performance.now();
    if (new URLSearchParams(location.search).get('perf') !== '1') return;
    const output = document.createElement('output');
    output.hidden = true;
    output.id = 'growth-performance';
    document.body.append(output);
    const sample = () => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      output.textContent = JSON.stringify({ hydratedMs: Math.round(hydrated), ttfbMs: Math.round(nav?.responseStart ?? 0), documentMs: Math.round(nav?.responseEnd ?? 0), scriptBytes: resources.filter(r => r.initiatorType === 'script').reduce((n,r) => n+r.encodedBodySize,0), requests: resources.length, apiRequests: resources.filter(r => new URL(r.name).pathname.startsWith('/api/')).length, paints: performance.getEntriesByType('paint').map(p => ({name:p.name,ms:Math.round(p.startTime)})) });
    };
    sample();
    const timer = setInterval(sample, 1000);
    return () => { clearInterval(timer); output.remove(); };
  }, []);
  return null;
}
