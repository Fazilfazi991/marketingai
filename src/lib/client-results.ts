import "server-only";
import { cache } from "react";

import { isDemoMode } from "@/lib/demo-mode";
import { createClient } from "@/lib/supabase/server";
import { applyLocalResultsScenario } from "./client-results-qa";

export type ClientResultsData = {
  scope?: string;
  unavailableSources?: string[];
  loadedSources?: string[];
  clientName: string;
  periodLabel: string;
  rangeKey: ResultRangeKey;
  rangeStart: string;
  rangeEnd: string;
  updatedAt: string;
  leads: {
    total: number;
    qualified: number;
    growth: number | null;
    sources: Array<{
      key: string;
      label: string;
      value: number;
      tone: string;
      growth: number | null;
    }>;
    trend: Array<{ label: string; value: number }>;
    latest: Array<{
      id: string;
      name: string;
      service: string;
      source: string;
      createdAt: string;
    }>;
  };
  traffic: {
    visitors: number;
    newVisitors: number;
    pageViews: number;
    whatsappClicks: number;
    formSubmissions: number;
    growth: number | null;
    connected?: boolean;
    trend?: Array<{ label: string; value: number }>;
  };
  search: {
    clicks: number;
    impressions: number;
    improved: number;
    topTen: number;
    keywords: Array<{ keyword: string; previous: number; current: number }>;
    connected?: boolean;
    trend?: Array<{ label: string; value: number }>;
  };
  ai: {
    websiteConversations: number;
    websiteLeads: number;
    whatsappConversations: number;
    whatsappLeads: number;
  };
  work: string[];
  topPages: Array<{ page: string; visitors: number; leads: number }>;
  opportunities: Array<{ keyword: string; position: number; note: string }>;
  nextFocus: string[];
  summary: string;
  report: ClientReport | null;
  reports: ClientReport[];
  isDemo: boolean;
};

export type ResultRangeKey =
  "today" | "7d" | "month" | "last-month" | "30d" | "90d" | "year" | "custom";

export type ResultRangeInput = { range?: string; from?: string; to?: string };

export type ClientReport = {
  month: string;
  monthLabel: string;
  summary: string;
  work: string[];
  nextFocus: string;
  users: number;
  clicks: number;
  posts: number;
};

const demoResults: ClientResultsData = {
  clientName: "ABC Interiors",
  periodLabel: "September 2026",
  rangeKey: "month",
  rangeStart: "2026-09-01",
  rangeEnd: "2026-09-30",
  updatedAt: "18 min ago",
  leads: {
    total: 47,
    qualified: 35,
    growth: 18,
    sources: [
      {
        key: "whatsapp",
        label: "WhatsApp",
        value: 21,
        tone: "green",
        growth: 24,
      },
      {
        key: "website_chatbot",
        label: "Website AI",
        value: 14,
        tone: "purple",
        growth: 8,
      },
      {
        key: "website_form",
        label: "Website form",
        value: 12,
        tone: "blue",
        growth: -3,
      },
    ],
    trend: [
      { label: "Jun", value: 24 },
      { label: "Jul", value: 31 },
      { label: "Aug", value: 40 },
      { label: "Sep", value: 47 },
    ],
    latest: [
      {
        id: "demo-lead-1",
        name: "Ahmed",
        service: "Kitchen renovation",
        source: "WhatsApp",
        createdAt: "Today · 10:42",
      },
      {
        id: "demo-lead-2",
        name: "Sarah",
        service: "Villa interior",
        source: "Website AI",
        createdAt: "Today · 09:18",
      },
      {
        id: "demo-lead-3",
        name: "Mohammed",
        service: "Wardrobes",
        source: "Website form",
        createdAt: "Yesterday",
      },
    ],
  },
  traffic: {
    visitors: 2840,
    newVisitors: 2120,
    pageViews: 5470,
    whatsappClicks: 186,
    formSubmissions: 12,
    growth: 24,
    connected: true,
    trend: [
      { label: "Jun", value: 2100 },
      { label: "Jul", value: 2380 },
      { label: "Aug", value: 2500 },
      { label: "Sep", value: 2840 },
    ],
  },
  search: {
    clicks: 684,
    impressions: 18420,
    improved: 3,
    topTen: 2,
    keywords: [
      { keyword: "kitchen renovation dubai", previous: 14.2, current: 8.4 },
      { keyword: "villa renovation dubai", previous: 22.1, current: 13.7 },
      { keyword: "interior company dubai", previous: 11.6, current: 7.9 },
    ],
    connected: true,
    trend: [
      { label: "Jun", value: 410 },
      { label: "Jul", value: 495 },
      { label: "Aug", value: 570 },
      { label: "Sep", value: 684 },
    ],
  },
  ai: {
    websiteConversations: 83,
    websiteLeads: 14,
    whatsappConversations: 126,
    whatsappLeads: 21,
  },
  work: [
    "12 social creatives created",
    "12 social posts published",
    "2 SEO articles published",
    "7 SEO improvements",
    "3 website updates",
    "3 keywords improved",
  ],
  topPages: [
    { page: "Kitchen Renovation", visitors: 684, leads: 9 },
    { page: "Villa Renovation", visitors: 422, leads: 6 },
    { page: "Home", visitors: 390, leads: 5 },
  ],
  opportunities: [
    {
      keyword: "Villa renovation Dubai",
      position: 13.7,
      note: "Close to page one",
    },
    {
      keyword: "Luxury interior Dubai",
      position: 18.2,
      note: "High-impression opportunity",
    },
  ],
  nextFocus: [
    "Push Villa Renovation Dubai onto page one",
    "Improve the kitchen-renovation landing page conversion",
    "Create content around Dubai renovation costs",
    "Increase qualified WhatsApp enquiries",
  ],
  summary:
    "Your business generated 47 tracked enquiries this month, up 18% from August. WhatsApp was the largest source, while organic website traffic increased 24%.",
  report: {
    month: "2026-09-01",
    monthLabel: "September 2026",
    summary:
      "Strong lead growth, improving visibility for renovation searches, and a clear focus for next month.",
    work: [
      "12 social posts published",
      "2 SEO articles published",
      "7 SEO improvements",
      "3 website updates",
    ],
    nextFocus:
      "Build visibility for villa renovation searches and strengthen project-led proof using verified original photography.",
    users: 2840,
    clicks: 684,
    posts: 12,
  },
  reports: [],
  isDemo: true,
};
demoResults.reports = demoResults.report
  ? [
      demoResults.report,
      {
        month: "2026-08-01",
        monthLabel: "August 2026",
        summary:
          "Lead volume increased as renovation landing pages gained visibility and WhatsApp remained the strongest enquiry channel.",
        work: [
          "10 social posts published",
          "2 SEO articles published",
          "5 SEO improvements",
        ],
        nextFocus:
          "Improve conversion paths on the strongest renovation pages and expand kitchen-renovation search coverage.",
        users: 2290,
        clicks: 571,
        posts: 10,
      },
      {
        month: "2026-07-01",
        monthLabel: "July 2026",
        summary:
          "Organic discovery and consistent social delivery established a stronger baseline for measurable lead growth.",
        work: [
          "9 social posts published",
          "1 SEO article published",
          "4 SEO improvements",
        ],
        nextFocus:
          "Strengthen service-page proof and make WhatsApp calls to action easier to reach on mobile.",
        users: 1980,
        clicks: 492,
        posts: 9,
      },
    ]
  : [];

const numberFrom = (metrics: unknown, ...keys: string[]) => {
  if (!metrics || typeof metrics !== "object") return 0;
  const record = metrics as Record<string, unknown>;
  for (const key of keys) {
    const value = Number(record[key]);
    if (Number.isFinite(value)) return value;
  }
  return 0;
};

const monthKey = (date: Date) =>
  `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
const monthLabel = (date: Date, short = false) =>
  new Intl.DateTimeFormat("en", {
    month: short ? "short" : "long",
    year: short ? undefined : "numeric",
    timeZone: "UTC",
  }).format(date);

const isoDay = (date: Date) => date.toISOString().slice(0, 10);
const addDays = (date: Date, days: number) =>
  new Date(date.getTime() + days * 86400000);
const validDay = (value?: string) => /^\d{4}-\d{2}-\d{2}$/.test(value ?? "");

const rangeBounds = (input: ResultRangeInput, reference = new Date()) => {
  const allowed = new Set<ResultRangeKey>([
    "today",
    "7d",
    "month",
    "last-month",
    "30d",
    "90d",
    "year",
    "custom",
  ]);
  const key = allowed.has(input.range as ResultRangeKey)
    ? (input.range as ResultRangeKey)
    : "month";
  const today = new Date(
    Date.UTC(
      reference.getUTCFullYear(),
      reference.getUTCMonth(),
      reference.getUTCDate(),
    ),
  );
  let start = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1),
  );
  let end = addDays(today, 1);
  if (key === "today") start = today;
  if (key === "7d") start = addDays(today, -6);
  if (key === "30d") start = addDays(today, -29);
  if (key === "90d") start = addDays(today, -89);
  if (key === "year") start = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
  if (key === "last-month") {
    end = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
    start = new Date(
      Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1),
    );
  }
  if (key === "custom" && validDay(input.from) && validDay(input.to)) {
    const requestedStart = new Date(`${input.from}T00:00:00Z`);
    const requestedEnd = new Date(`${input.to}T00:00:00Z`);
    if (requestedStart <= requestedEnd && requestedEnd <= today) {
      start = requestedStart;
      end = addDays(requestedEnd, 1);
    }
  }
  const duration = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 86400000),
  );
  return {
    key,
    start,
    end,
    previousStart: addDays(start, -duration),
    previousEnd: start,
    duration,
  };
};

const rangeLabel = (key: ResultRangeKey, start: Date, end: Date) => {
  if (key === "today") return "Today";
  if (key === "month" || key === "last-month") return monthLabel(start);
  const format = new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
  return `${format.format(start)} – ${format.format(addDays(end, -1))}`;
};

const demoForRange = (input: ResultRangeInput): ClientResultsData => {
  const bounds = rangeBounds(input, new Date("2026-09-30T12:00:00Z"));
  if (bounds.key === "month") return demoResults;
  const factor = bounds.key === "last-month" ? 0.85 : bounds.duration / 30;
  const scale = (value: number) => Math.round(value * factor);
  const scaleCopy = (value: string) =>
    value.replace(/^\d+/, (number) => String(scale(Number(number))));
  const total = scale(demoResults.leads.total);
  const demoTrend =
    bounds.key === "90d"
      ? demoResults.leads.trend.slice(-3)
      : [
          {
            label: rangeLabel(bounds.key, bounds.start, bounds.end),
            value: total,
          },
        ];
  return {
    ...demoResults,
    periodLabel: rangeLabel(bounds.key, bounds.start, bounds.end),
    rangeKey: bounds.key,
    rangeStart: isoDay(bounds.start),
    rangeEnd: isoDay(addDays(bounds.end, -1)),
    leads: {
      ...demoResults.leads,
      total,
      qualified: scale(demoResults.leads.qualified),
      sources: demoResults.leads.sources.map((source) => ({
        ...source,
        value: scale(source.value),
      })),
      trend: demoTrend,
      latest:
        bounds.key === "today"
          ? demoResults.leads.latest.slice(0, 2)
          : demoResults.leads.latest,
    },
    traffic: {
      ...demoResults.traffic,
      trend: [],
      visitors: scale(demoResults.traffic.visitors),
      newVisitors: scale(demoResults.traffic.newVisitors),
      pageViews: scale(demoResults.traffic.pageViews),
      whatsappClicks: scale(demoResults.traffic.whatsappClicks),
      formSubmissions: scale(demoResults.traffic.formSubmissions),
    },
    search: {
      ...demoResults.search,
      trend: [],
      clicks: scale(demoResults.search.clicks),
      impressions: scale(demoResults.search.impressions),
    },
    ai: {
      websiteConversations: scale(demoResults.ai.websiteConversations),
      websiteLeads: scale(demoResults.ai.websiteLeads),
      whatsappConversations: scale(demoResults.ai.whatsappConversations),
      whatsappLeads: scale(demoResults.ai.whatsappLeads),
    },
    work: demoResults.work.map(scaleCopy),
    topPages: demoResults.topPages.map((page) => ({
      ...page,
      visitors: scale(page.visitors),
      leads: scale(page.leads),
    })),
    summary: `${total} tracked enquiries were recorded for this selected period. WhatsApp remained the largest measured source, while website and Google results are shown for the same dates.`,
  };
};

export const getClientWorkspace = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Sign in to view client results.");
  const { data: membership, error: membershipError } = await supabase
    .from("client_members")
    .select("client_id,clients(name)")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (membershipError || !membership)
    throw new Error("No client workspace is assigned to this account.");
  const clientId = String(membership.client_id);
  const joinedClient = membership.clients as unknown as {
    name?: string;
  } | null;

  return {
    supabase,
    clientId,
    clientName: joinedClient?.name ?? "Client workspace",
    scope: `${user.id}:${clientId}`,
  };
});

// React.cache is request-scoped: identity and RLS results never cross sessions.
const getClientSources = cache(
  async (range?: string, from?: string, to?: string) => {
    const workspace = await getClientWorkspace();
    const { supabase, clientId } = workspace;
    const bounds = rangeBounds({ range, from, to }, new Date());
    const currentStart = bounds.start,
      nextStart = bounds.end,
      historyStart = bounds.previousStart;
    const iso = (date: Date) => date.toISOString().slice(0, 10);
    return {
      workspace,
      queries: {
        leads: cache(async () =>
          supabase
            .from("leads")
            .select(
              "id,name,service,source,source_url,created_at,lead_quality,status",
            )
            .eq("client_id", clientId)
            .gte("created_at", historyStart.toISOString())
            .lt("created_at", nextStart.toISOString()),
        ),
        analytics: cache(async () =>
          supabase
            .from("analytics_daily")
            .select("day,metrics")
            .eq("client_id", clientId)
            .gte("day", iso(historyStart))
            .lt("day", iso(nextStart))
            .order("day"),
        ),
        search: cache(async () =>
          supabase
            .from("search_console_daily")
            .select("day,metrics")
            .eq("client_id", clientId)
            .gte("day", iso(currentStart))
            .lt("day", iso(nextStart))
            .order("day"),
        ),
        keywords: cache(async () => supabase.rpc("client_keyword_results")),
        reports: cache(async () =>
          supabase
            .from("reports")
            .select(
              "month,summary,work_completed,analytics_summary,next_month_focus",
            )
            .eq("client_id", clientId)
            .eq("status", "published")
            .order("month", { ascending: false })
            .limit(24),
        ),
        content: cache(async () =>
          supabase
            .from("content_items")
            .select("content_kind,status")
            .eq("client_id", clientId)
            .gte("month", iso(currentStart))
            .lt("month", iso(nextStart))
            .eq("status", "published"),
        ),
        tasks: cache(async () =>
          supabase
            .from("tasks")
            .select("category,status")
            .eq("client_id", clientId)
            .gte("deliverable_month", iso(currentStart))
            .lt("deliverable_month", iso(nextStart))
            .in("status", ["published", "verified"]),
        ),
        pages: cache(async () =>
          supabase
            .from("analytics_page_daily")
            .select("page_path,users")
            .eq("client_id", clientId)
            .gte("day", iso(currentStart))
            .lt("day", iso(nextStart)),
        ),
        health: cache(async () => supabase.rpc("client_result_health")),
      },
    };
  },
);
export type ClientResultPart =
  "all" | "primary" | "metrics" | "insights" | "leads" | "traffic" | "reports";
const partSources: Record<ClientResultPart, string[]> = {
  all: [
    "leads",
    "analytics",
    "search",
    "keywords",
    "reports",
    "content",
    "tasks",
    "pages",
    "health",
  ],
  primary: ["leads", "keywords", "reports"],
  metrics: ["leads", "analytics", "search", "health"],
  insights: [
    "leads",
    "search",
    "keywords",
    "reports",
    "content",
    "tasks",
    "pages",
  ],
  leads: ["leads"],
  traffic: [
    "leads",
    "analytics",
    "search",
    "keywords",
    "pages",
    "reports",
    "health",
  ],
  reports: ["reports"],
};

export async function loadClientResults(
  input: ResultRangeInput = {},
  part: ClientResultPart = "all",
): Promise<ClientResultsData> {
  if (isDemoMode()) return applyLocalResultsScenario(demoForRange(input), part);
  const {
    workspace: { clientName, scope },
    queries: sources,
  } = await getClientSources(input.range, input.from, input.to);
  const now = new Date();
  const bounds = rangeBounds(input, now);
  const currentStart = bounds.start;
  const nextStart = bounds.end;
  const unavailableSources: string[] = [];
  const read = async <K extends keyof typeof sources>(
    name: K,
  ): Promise<Awaited<ReturnType<(typeof sources)[K]>>> => {
    type Result = Awaited<ReturnType<(typeof sources)[K]>>;
    const empty = { data: null, error: null } as Result;
    if (!partSources[part].includes(name)) return empty;
    try {
      const result = await sources[name]();
      if (result.error) {
        unavailableSources.push(name);
        return empty;
      }
      return result as Result;
    } catch {
      unavailableSources.push(name);
      return empty;
    }
  };
  const [
    { data: leads },
    { data: analytics },
    { data: searchRows },
    { data: keywords },
    { data: reports },
    { data: content },
    { data: completedTasks },
    { data: pageRows },
    { data: integrationHealth },
  ] = await Promise.all([
    read("leads"),
    read("analytics"),
    read("search"),
    read("keywords"),
    read("reports"),
    read("content"),
    read("tasks"),
    read("pages"),
    read("health"),
  ]);

  const currentLeads = (leads ?? []).filter((item) => {
    const date = new Date(item.created_at);
    return date >= currentStart && date < nextStart;
  });
  const previousLeads = (leads ?? []).filter((item) => {
    const date = new Date(item.created_at);
    return date >= bounds.previousStart && date < bounds.previousEnd;
  });
  const sourceDefinitions = [
    { key: "whatsapp", label: "WhatsApp", tone: "green" },
    { key: "website_chatbot", label: "Website AI chatbot", tone: "purple" },
    { key: "website_form", label: "Website form", tone: "blue" },
    { key: "other", label: "Other sources", tone: "sand" },
  ];
  const trendBucketCount =
    bounds.duration <= 7
      ? bounds.duration
      : bounds.duration <= 31
        ? Math.min(6, bounds.duration)
        : 4;
  const trend = Array.from({ length: trendBucketCount }, (_, index) => {
    const bucketStart = addDays(
      currentStart,
      Math.floor((bounds.duration * index) / trendBucketCount),
    );
    const bucketEnd =
      index === trendBucketCount - 1
        ? nextStart
        : addDays(
            currentStart,
            Math.floor((bounds.duration * (index + 1)) / trendBucketCount),
          );
    const label =
      bounds.duration <= 31
        ? new Intl.DateTimeFormat("en", {
            day: "numeric",
            month: "short",
            timeZone: "UTC",
          }).format(bucketStart)
        : monthLabel(bucketStart, true);
    return {
      label,
      value: (leads ?? []).filter((item) => {
        const date = new Date(item.created_at);
        return date >= bucketStart && date < bucketEnd;
      }).length,
    };
  });
  const currentAnalytics = (analytics ?? []).filter((item) => {
    const date = new Date(`${item.day}T00:00:00Z`);
    return date >= currentStart && date < nextStart;
  });
  const previousAnalytics = (analytics ?? []).filter((item) => {
    const date = new Date(`${item.day}T00:00:00Z`);
    return date >= bounds.previousStart && date < bounds.previousEnd;
  });
  const sum = (rows: Array<{ metrics: unknown }>, ...keys: string[]) =>
    rows.reduce((total, row) => total + numberFrom(row.metrics, ...keys), 0);
  const visitors = sum(currentAnalytics, "activeUsers", "users", "visitors");
  const previousVisitors = sum(
    previousAnalytics,
    "activeUsers",
    "users",
    "visitors",
  );
  const searchClicks = sum(searchRows ?? [], "clicks");
  const searchImpressions = sum(searchRows ?? [], "impressions");
  const keywordRows = (keywords ?? []) as Array<{
    keyword: string;
    current_position: number | null;
    previous_position: number | null;
  }>;
  const improved = keywordRows.filter(
    (item) => Number(item.current_position) < Number(item.previous_position),
  ).length;
  const topTen = keywordRows.filter(
    (item) => Number(item.current_position) <= 10,
  ).length;
  const growth = (current: number, previous: number) =>
    previous ? Math.round(((current - previous) / previous) * 100) : null;
  const sourceCount = (source: string) =>
    currentLeads.filter((item) => item.source === source).length;
  const gaHealth = (integrationHealth ?? []).find(
    (item: { provider: string }) => item.provider === "google_analytics",
  ) as { status?: string; last_synced_at?: string } | undefined;
  const scHealth = (integrationHealth ?? []).find(
    (item: { provider: string }) => item.provider === "search_console",
  ) as { status?: string; last_synced_at?: string } | undefined;
  const dayLabel = (day: string) =>
    new Intl.DateTimeFormat("en", {
      day: "numeric",
      month: "short",
      timeZone: "UTC",
    }).format(new Date(`${day}T00:00:00Z`));
  const trafficTrend = currentAnalytics.map((item) => ({
    label: dayLabel(String(item.day)),
    value: numberFrom(item.metrics, "activeUsers", "users", "visitors"),
  }));
  const searchByDay = new Map<string, number>();
  for (const item of searchRows ?? [])
    searchByDay.set(
      String(item.day),
      (searchByDay.get(String(item.day)) ?? 0) +
        numberFrom(item.metrics, "clicks"),
    );
  const searchTrend = [...searchByDay]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, value]) => ({ label: dayLabel(day), value }));
  const pages = new Map<string, number>();
  for (const item of pageRows ?? [])
    pages.set(
      String(item.page_path),
      (pages.get(String(item.page_path)) ?? 0) + Number(item.users ?? 0),
    );
  const previousSourceCount = (source: string) =>
    previousLeads.filter((item) => item.source === source).length;
  const publishedContent = content ?? [];
  const tasks = completedTasks ?? [];
  const completedCount = (categories: string[]) =>
    tasks.filter((item) =>
      categories.includes(String(item.category).toLowerCase()),
    ).length;
  const workCounts = [
    {
      count: publishedContent.filter(
        (item) => item.content_kind === "social_post",
      ).length,
      label: "social posts published",
    },
    {
      count: publishedContent.filter((item) => item.content_kind === "blog")
        .length,
      label: "blogs published",
    },
    {
      count: completedCount(["seo", "seo_review", "seo_improvement"]),
      label: "SEO improvements completed",
    },
    {
      count: completedCount([
        "website",
        "website_update",
        "website_maintenance",
      ]),
      label: "website updates completed",
    },
  ];
  const work = workCounts
    .filter((item) => item.count > 0)
    .map((item) => `${item.count} ${item.label}`);
  const total = currentLeads.length;
  const primarySources = new Set([
    "whatsapp",
    "website_chatbot",
    "website_form",
  ]);
  const sourceValue = (source: string) =>
    source === "other"
      ? currentLeads.filter((item) => !primarySources.has(item.source)).length
      : sourceCount(source);
  const attributedSources = sourceDefinitions.map((source) => {
    const value = sourceValue(source.key),
      previous =
        source.key === "other"
          ? previousLeads.filter((item) => !primarySources.has(item.source))
              .length
          : previousSourceCount(source.key);
    return { ...source, value, growth: growth(value, previous) };
  });
  const largest = attributedSources
    .slice()
    .sort((a, b) => b.value - a.value)[0];
  const clientReports: ClientReport[] = (reports ?? []).map((item) => {
    const metrics = item.analytics_summary;
    const reportWorkValue = item.work_completed;
    return {
      month: String(item.month),
      monthLabel: monthLabel(new Date(`${item.month}T00:00:00Z`)),
      summary: item.summary ?? "Your published monthly growth results.",
      work: Array.isArray(reportWorkValue) ? reportWorkValue.map(String) : [],
      nextFocus:
        item.next_month_focus ??
        "Continue the strongest-performing growth activities.",
      users: numberFrom(metrics, "users", "activeUsers", "visitors"),
      clicks: numberFrom(metrics, "clicks", "organicClicks"),
      posts: numberFrom(metrics, "posts", "socialPosts", "social_posts"),
    };
  });
  const report =
    clientReports.find(
      (item) => item.month.slice(0, 7) === monthKey(currentStart),
    ) ?? null;

  return {
    clientName,
    scope,
    unavailableSources,
    loadedSources: partSources[part],
    periodLabel: rangeLabel(bounds.key, currentStart, nextStart),
    rangeKey: bounds.key,
    rangeStart: isoDay(currentStart),
    rangeEnd: isoDay(addDays(nextStart, -1)),
    updatedAt: [gaHealth?.last_synced_at, scHealth?.last_synced_at]
      .filter(Boolean)
      .sort()
      .at(-1)
      ? new Intl.DateTimeFormat("en-AE", {
          day: "numeric",
          month: "short",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Asia/Dubai",
        }).format(
          new Date(
            [gaHealth?.last_synced_at, scHealth?.last_synced_at]
              .filter(Boolean)
              .sort()
              .at(-1)!,
          ),
        )
      : "when a connected source first syncs",
    leads: {
      total,
      qualified: currentLeads.filter(
        (item) =>
          ["qualified", "high_intent"].includes(item.lead_quality) ||
          ["qualified", "won"].includes(item.status),
      ).length,
      growth: growth(total, previousLeads.length),
      sources: attributedSources,
      trend,
      latest: currentLeads
        .slice()
        .sort((a, b) =>
          String(b.created_at).localeCompare(String(a.created_at)),
        )
        .slice(0, 5)
        .map((item) => ({
          id: String(item.id),
          name: item.name || "New enquiry",
          service: item.service || "General enquiry",
          source:
            sourceDefinitions.find((source) => source.key === item.source)
              ?.label ?? "Other",
          createdAt: new Intl.DateTimeFormat("en", {
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
          }).format(new Date(item.created_at)),
        })),
    },
    traffic: {
      visitors,
      newVisitors: sum(currentAnalytics, "newUsers", "new_visitors"),
      pageViews: sum(
        currentAnalytics,
        "screenPageViews",
        "pageViews",
        "page_views",
      ),
      whatsappClicks: sum(
        currentAnalytics,
        "whatsappClicks",
        "whatsapp_clicks",
      ),
      formSubmissions: sourceCount("website_form"),
      growth: growth(visitors, previousVisitors),
      connected: gaHealth?.status === "connected",
      trend: trafficTrend,
    },
    search: {
      clicks: searchClicks,
      impressions: searchImpressions,
      improved,
      topTen,
      keywords: keywordRows.map((item) => ({
        keyword: String(item.keyword),
        previous: Number(item.previous_position),
        current: Number(item.current_position),
      })),
      connected: scHealth?.status === "connected",
      trend: searchTrend,
    },
    ai: {
      websiteConversations: sum(
        currentAnalytics,
        "websiteAiConversations",
        "website_ai_conversations",
      ),
      websiteLeads: currentLeads.filter(
        (item) =>
          item.source === "website_chatbot" &&
          (["qualified", "high_intent"].includes(item.lead_quality) ||
            ["qualified", "won"].includes(item.status)),
      ).length,
      whatsappConversations: sum(
        currentAnalytics,
        "whatsappConversations",
        "whatsapp_conversations",
      ),
      whatsappLeads: currentLeads.filter(
        (item) =>
          item.source === "whatsapp" &&
          (["qualified", "high_intent"].includes(item.lead_quality) ||
            ["qualified", "won"].includes(item.status)),
      ).length,
    },
    work,
    topPages: [...pages]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([page, visitors]) => ({
        page,
        visitors,
        leads: currentLeads.filter((item) =>
          String((item as { source_url?: string }).source_url ?? "").includes(
            page,
          ),
        ).length,
      })),
    opportunities: keywordRows
      .filter(
        (item) =>
          Number(item.current_position) > 10 &&
          Number(item.current_position) <= 20,
      )
      .slice(0, 3)
      .map((item) => ({
        keyword: String(item.keyword),
        position: Number(item.current_position),
        note:
          Number(item.current_position) <= 15
            ? "Close to page one"
            : "Visibility opportunity",
      })),
    nextFocus: report?.nextFocus ? [report.nextFocus] : [],
    summary:
      report?.summary ??
      (total
        ? `Your business generated ${total} tracked enquiries in ${monthLabel(currentStart)}. ${largest.value ? `${largest.label} was the largest measured source.` : "Source attribution is still being collected."}`
        : "No tracked enquiries have been recorded for this period yet."),
    report,
    reports: clientReports,
    isDemo: false,
  };
}
