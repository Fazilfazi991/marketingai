import type { EvidencePacket, Fact, Period, SourceState } from "./contracts";

export const finiteMetric = (value: unknown): number | null =>
  typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;

export function changePercent(current: number | null, previous: number | null): number | null {
  return current !== null && previous !== null && previous > 0
    ? Math.round((current - previous) / previous * 1000) / 10 : null;
}

const dayPattern = /^\d{4}-\d{2}-\d{2}$/;
function day(value: string) {
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (!dayPattern.test(value) || !Number.isFinite(parsed) || new Date(parsed).toISOString().slice(0, 10) !== value)
    throw new Error("Invalid evidence date.");
  return parsed;
}
export function daysIn(period: Period) {
  const count = (day(period.to) - day(period.from)) / 86400000 + 1;
  if (count < 1 || count > 93) throw new Error("Evidence period must be between 1 and 93 days.");
  return count;
}
export function previousPeriod(period: Period): Period {
  const count = daysIn(period);
  return { from: new Date(day(period.from) - count * 86400000).toISOString().slice(0, 10), to: new Date(day(period.from) - 86400000).toISOString().slice(0, 10) };
}

export type MetricRow = { day: string; value: unknown };
/** Additive metrics only. Never use this to claim unique users across days/pages. */
export function sumObserved(rows: MetricRow[], period: Period) {
  const selected = rows.filter(r => r.day >= period.from && r.day <= period.to);
  const dates = new Set(selected.map(r => r.day));
  const valid = selected.length > 0 && selected.every(r => finiteMetric(r.value) !== null);
  return { value: valid ? selected.reduce((n, r) => n + (r.value as number), 0) : null,
    complete: valid && dates.size === daysIn(period), observedDays: dates.size };
}

export function metricFact(id: string, source: "analytics" | "search", label: string, rows: MetricRow[], period: Period): Fact | null {
  const current = sumObserved(rows, period), prior = sumObserved(rows, previousPeriod(period));
  if (current.value === null) return null;
  const comparable = current.complete && prior.complete;
  return { id, source, label, value: current.value, unit: "count", period,
    previous: comparable ? prior.value : null,
    changePercent: comparable ? changePercent(current.value, prior.value) : null,
    calculation: `Sum of observed rows (${current.observedDays}/${daysIn(period)} days). ${comparable ? "Equal-length observed-day comparison." : "Comparison withheld: incomplete observed-day coverage."}` };
}

export type SearchRow = { day: string; query: string; page: string; clicks: unknown; impressions: unknown; position: unknown };
export function searchFacts(rows: SearchRow[], period: Period) {
  const selected = rows.filter(r => r.day >= period.from && r.day <= period.to);
  const groups = new Map<string, SearchRow[]>();
  for (const row of selected) {
    const key = JSON.stringify([row.page, row.query]);
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  return [...groups.values()].flatMap(group => {
    if (!group.every(r => finiteMetric(r.clicks) !== null && finiteMetric(r.impressions) !== null && finiteMetric(r.position) !== null)) return [];
    const impressions = group.reduce((n, r) => n + (r.impressions as number), 0);
    const clicks = group.reduce((n, r) => n + (r.clicks as number), 0);
    if (!impressions) return [];
    return [{ page: group[0].page, query: group[0].query, clicks, impressions,
      ctr: clicks / impressions * 100,
      position: group.reduce((n, r) => n + (r.position as number) * (r.impressions as number), 0) / impressions }];
  }).sort((a, b) => b.impressions - a.impressions).slice(0, 10);
}

export function addSearchEvidence(packet: EvidencePacket, rows: SearchRow[], period: Period) {
  // Aggregates describe stored query/page rows, not the unfiltered GSC property total.
  for (const metric of ["clicks", "impressions"] as const) {
    const fact = metricFact(`search.${metric}`, "search", `Recorded query/page ${metric}`, rows.map(r => ({ day: r.day, value: r[metric] })), period);
    if (fact) packet.facts.push(fact);
  }
  for (const [index, row] of searchFacts(rows, period).entries()) {
    const id = `search.opportunity.${index}`;
    packet.facts.push({ id, source: "search", label: "Impression-weighted average position", value: Math.round(row.position * 10) / 10,
      unit: "position", period, previous: null, changePercent: null, calculation: `Weighted by ${row.impressions} recorded impressions; ${row.clicks} clicks; CTR ${(row.ctr).toFixed(2)}%.`, page: row.page, query: row.query });
    if (row.position > 10 && row.position <= 20 && row.impressions >= 25)
      packet.recommendations.push({ id: `recommendation.${index}`, text: "Review this page’s search intent, title and description. Its observed position and impressions make it a candidate for improvement, not a guaranteed traffic gain.", evidenceIds: [id], page: row.page, query: row.query });
  }
  packet.limitations.push("Search totals cover stored query/page rows; anonymized queries and provider row limits may exclude traffic. Observed days do not certify complete source ingestion.");
}

export function newEvidence(): EvidencePacket {
  return { version: "growth-v1", facts: [], recommendations: [], sources: {}, limitations: ["Traffic correlations do not establish causation.", "Conversion impact and service-level attribution are unavailable unless explicitly measured."] };
}

/** Only inspected metadata, never an inferred ranking/traffic opportunity. */
export function addWebsiteEvidence(packet: EvidencePacket, rows: Record<string, unknown>[]) {
  const inspected = rows.filter(row => typeof row.last_inspected_at === "string" && Number.isFinite(Date.parse(row.last_inspected_at)) && typeof row.id === "string" && typeof row.url === "string");
  for (const row of inspected.slice(0, 10)) {
    const status = finiteMetric(row.status_code);
    if (status === null) continue;
    const id = `website.${row.id}`, page = String(row.url).slice(0,500);
    packet.facts.push({ id, source: "website", label: "Last inspected HTTP status", value: status, unit: "count", period: null, previous: null, changePercent: null, calculation: `Inspection: ${String(row.last_inspected_at).slice(0,40)}. Not a live uptime check.`, page });
    const issues: string[] = [];
    if (status >= 400) issues.push("Review the recorded HTTP error");
    for (const [key, label] of [["title", "page title"], ["meta_description", "meta description"], ["h1", "H1 heading"]]) {
      // Absent database field is unavailable, not proof of missing page markup.
      if (typeof row[key] === "string" && !row[key].trim()) issues.push(`Check the missing ${label} in the inspected HTML`);
    }
    if (issues.length) {
      const findingId = `${id}.findings`;
      packet.facts.push({ id: findingId, source: "website", label: "Inspected website findings", value: issues.join("; "), unit: "text", period: null, previous: null, changePercent: null, calculation: `Derived only from stored HTML inspection ${row.last_inspected_at}; rendered-browser verification may be required.`, page });
      packet.recommendations.push({ id: `${id}.review`, text: `${issues.join("; ")}. This is a website inspection priority, not evidence of traffic loss or guaranteed SEO benefit.`, evidenceIds: [id, findingId], page });
    }
  }
  if (inspected.length > 10) packet.limitations.push("Website evidence is a bounded sample of ten inspected pages, not an exhaustive site audit.");
  if (inspected.length) packet.limitations.push("Website inventory does not measure Google demand, rankings, clicks, traffic or conversions.");
}
export function sourceState(rows: { day?: string }[], error: boolean, truncated = false): SourceState {
  return { state: error ? "unavailable" : truncated ? "truncated" : rows.length ? "available" : "missing", through: rows.map(r => r.day).filter((v): v is string => Boolean(v)).sort().at(-1) ?? null };
}
