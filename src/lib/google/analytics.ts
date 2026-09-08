import "server-only";
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
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500);
    throw new Error(
      `Google API request failed (${response.status}): ${detail}`,
    );
  }
  return response.json() as Promise<T>;
}
export type Ga4Report = {
  rows?: Array<{
    dimensionValues?: Array<{ value?: string }>;
    metricValues?: Array<{ value?: string }>;
  }>;
};
export type SearchConsoleReport = {
  rows?: Array<{
    keys?: string[];
    clicks?: number;
    impressions?: number;
    ctr?: number;
    position?: number;
  }>;
};
export async function fetchGa4Report(config: GoogleAccess, range: ImportRange) {
  return googlePost<Ga4Report>(
    `https://analyticsdata.googleapis.com/v1beta/properties/${encodeURIComponent(config.ga4PropertyId)}:runReport`,
    config.accessToken,
    {
      dateRanges: [{ startDate: range.from, endDate: range.to }],
      dimensions: [{ name: "date" }, { name: "pagePath" }],
      metrics: [
        { name: "activeUsers" },
        { name: "newUsers" },
        { name: "sessions" },
        { name: "screenPageViews" },
      ],
      limit: 100000,
    },
  );
}
export async function fetchSearchConsoleReport(
  config: GoogleAccess,
  range: ImportRange,
) {
  return googlePost<SearchConsoleReport>(
    `https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(config.searchConsoleSiteUrl)}/searchAnalytics/query`,
    config.accessToken,
    {
      startDate: range.from,
      endDate: range.to,
      dimensions: ["date", "query", "page"],
      dataState: "final",
      rowLimit: 25000,
    },
  );
}
