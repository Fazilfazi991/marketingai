import "server-only";
import { googleJson } from './oauth-core';
export type GoogleAccess = {
  accessToken: string;
  ga4PropertyId: string;
  searchConsoleSiteUrl: string;
};
export type ImportRange = { from: string; to: string };
async function googlePost<T>(
  url: string,
  accessToken: string,
  body: unknown,
): Promise<T> {
  return googleJson<T>(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
}
export type Ga4Report = {
  rowCount?: number;
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
  dailyRows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
  dailyRowCount?: number;
  pageRequests?: number;
  pagePaginationComplete?: boolean;
};
export type SearchConsoleReport = {
  rows?: Array<{
    keys?: string[];
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  }>;
  pageRequests?: number;
  paginationComplete?: boolean;
  rowLimit?: number;
};
const isoDay = (value: string | undefined) => value && /^\d{8}$/.test(value)
  ? `${value.slice(0,4)}-${value.slice(4,6)}-${value.slice(6)}` : null;
const daysBefore = (day: string, count: number) => new Date(Date.parse(`${day}T00:00:00Z`) - count * 86400000).toISOString().slice(0,10);

export async function latestGa4CompletedObservation(config: GoogleAccess, today = new Date().toISOString().slice(0,10)) {
  const to = daysBefore(today,1), from = daysBefore(to,30), started = Date.now();
  const report = await googlePost<Ga4Report>(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(config.ga4PropertyId)}:runReport`,config.accessToken,
    {dateRanges:[{startDate:from,endDate:to}],dimensions:[{name:'date'}],metrics:[{name:'sessions'}],orderBys:[{dimension:{dimensionName:'date'},desc:true}],limit:1},
  );
  return {day:isoDay(report.rows?.[0]?.dimensionValues?.[0]?.value),fetchDurationMs:Date.now()-started};
}

export async function latestSearchConsoleCompletedObservation(config: GoogleAccess, today = new Date().toISOString().slice(0,10)) {
  const to = daysBefore(today,1), from = daysBefore(to,30), started = Date.now();
  const report = await googlePost<SearchConsoleReport>(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(config.searchConsoleSiteUrl)}/searchAnalytics/query`,config.accessToken,
    {startDate:from,endDate:to,dimensions:['date'],dataState:'final',rowLimit:1000},
  );
  const observed=(report.rows ?? []).map(row=>row.keys?.[0]).filter((value):value is string=>typeof value==='string' && /^\d{4}-\d{2}-\d{2}$/.test(value)).sort();
  return {day:observed.at(-1) ?? null,fetchDurationMs:Date.now()-started};
}
export async function fetchGa4Report(config: GoogleAccess, range: ImportRange) {
  const url = `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(config.ga4PropertyId)}:runReport`;
  const metrics = [
    { name: "activeUsers" },
    { name: "newUsers" },
    { name: "sessions" },
    { name: "screenPageViews" },
  ];
  const dailyRequest = googlePost<Ga4Report>(url, config.accessToken, {
    dateRanges: [{ startDate: range.from, endDate: range.to }],
    dimensions: [{ name: "date" }],
    metrics,
    limit: 1000,
  });
  const pageLimit = 100000, maxPageRequests = 10;
  const pageRequest = (async () => {
    const rows: NonNullable<Ga4Report["rows"]> = [];
    let rowCount = 0, pageRequests = 0, complete = false;
    for (let page = 0; page < maxPageRequests; page += 1) {
      const report = await googlePost<Ga4Report>(url, config.accessToken, {
        dateRanges: [{ startDate: range.from, endDate: range.to }],
        dimensions: [{ name: "date" }, { name: "pagePath" }],
        metrics,
        limit: pageLimit,
        offset: rows.length,
      });
      pageRequests += 1;
      const batch = report.rows ?? [];
      rows.push(...batch);
      rowCount = Math.max(rowCount, report.rowCount ?? rows.length);
      if (!batch.length || rows.length >= rowCount) { complete = true; break; }
    }
    return { rows, rowCount, pageRequests, pagePaginationComplete: complete };
  })();
  const [daily, pages] = await Promise.all([dailyRequest, pageRequest]);
  return { ...pages, dailyRows: daily.rows ?? [], dailyRowCount: daily.rowCount ?? daily.rows?.length ?? 0 } satisfies Ga4Report;
}
export async function fetchSearchConsoleReport(
  config: GoogleAccess,
  range: ImportRange,
) {
  const url = `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(config.searchConsoleSiteUrl)}/searchAnalytics/query`;
  const rowLimit = 25000, maxPageRequests = 40;
  const rows: NonNullable<SearchConsoleReport["rows"]> = [];
  let pageRequests = 0, paginationComplete = false;
  for (let page = 0; page < maxPageRequests; page += 1) {
    const report = await googlePost<SearchConsoleReport>(url, config.accessToken, {
      startDate: range.from,
      endDate: range.to,
      dimensions: ["date", "query", "page"],
      dataState: "final",
      rowLimit,
      startRow: rows.length,
    });
    pageRequests += 1;
    const batch = report.rows ?? [];
    if (!batch.length) { paginationComplete = true; break; }
    rows.push(...batch);
  }
  return { rows, rowLimit, pageRequests, paginationComplete } satisfies SearchConsoleReport;
}
