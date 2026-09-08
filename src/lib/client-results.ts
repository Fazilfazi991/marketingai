import "server-only";

import { isDemoMode } from "@/lib/demo-mode";
import { createClient } from "@/lib/supabase/server";

export type ClientResultsData = {
  clientName: string;
  periodLabel: string;
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
  };
  search: {
    clicks: number;
    impressions: number;
    improved: number;
    topTen: number;
    keywords: Array<{ keyword: string; previous: number; current: number }>;
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
  },
  search: {
    clicks: 684,
    impressions: 18420,
    improved: 18,
    topTen: 7,
    keywords: [
      { keyword: "kitchen renovation dubai", previous: 14.2, current: 8.4 },
      { keyword: "villa renovation dubai", previous: 22.1, current: 13.7 },
      { keyword: "interior company dubai", previous: 11.6, current: 7.9 },
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
    "18 keywords improved",
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

export async function loadClientResults(): Promise<ClientResultsData> {
  if (isDemoMode()) return demoResults;
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
  const now = new Date();
  const currentStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
  );
  const nextStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1),
  );
  const historyStart = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3, 1),
  );
  const iso = (date: Date) => date.toISOString().slice(0, 10);
  const [
    { data: leads, error: leadsError },
    { data: analytics, error: analyticsError },
    { data: searchRows, error: searchError },
    { data: keywords, error: keywordError },
    { data: reports, error: reportError },
    { data: content, error: contentError },
    { data: completedTasks, error: taskError },
  ] = await Promise.all([
    supabase
      .from("leads")
      .select("id,name,service,source,created_at,lead_quality,status")
      .eq("client_id", clientId)
      .gte("created_at", historyStart.toISOString())
      .lt("created_at", nextStart.toISOString()),
    supabase
      .from("analytics_daily")
      .select("day,metrics")
      .eq("client_id", clientId)
      .gte("day", iso(historyStart))
      .lt("day", iso(nextStart)),
    supabase
      .from("search_console_daily")
      .select("day,metrics")
      .eq("client_id", clientId)
      .gte("day", iso(currentStart))
      .lt("day", iso(nextStart)),
    supabase.rpc("client_keyword_results"),
    supabase
      .from("reports")
      .select("month,summary,work_completed,analytics_summary,next_month_focus")
      .eq("client_id", clientId)
      .eq("status", "published")
      .order("month", { ascending: false })
      .limit(24),
    supabase
      .from("content_items")
      .select("content_kind,status")
      .eq("client_id", clientId)
      .eq("month", iso(currentStart))
      .eq("status", "published"),
    supabase
      .from("tasks")
      .select("category,status")
      .eq("client_id", clientId)
      .eq("deliverable_month", iso(currentStart))
      .in("status", ["published", "verified"]),
  ]);
  for (const error of [
    leadsError,
    analyticsError,
    searchError,
    keywordError,
    reportError,
    contentError,
    taskError,
  ])
    if (error) throw error;

  const currentLeads = (leads ?? []).filter(
    (item) => new Date(item.created_at) >= currentStart,
  );
  const previousLeads = (leads ?? []).filter((item) => {
    const date = new Date(item.created_at);
    return (
      date >=
        new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)) &&
      date < currentStart
    );
  });
  const sourceDefinitions = [
    { key: "whatsapp", label: "WhatsApp", tone: "green" },
    { key: "website_chatbot", label: "Website AI chatbot", tone: "purple" },
    { key: "website_form", label: "Website form", tone: "blue" },
    { key: "other", label: "Other sources", tone: "sand" },
  ];
  const trend = Array.from({ length: 4 }, (_, index) => {
    const date = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 3 + index, 1),
    );
    return {
      label: monthLabel(date, true),
      value: (leads ?? []).filter(
        (item) => monthKey(new Date(item.created_at)) === monthKey(date),
      ).length,
    };
  });
  const currentAnalytics = (analytics ?? []).filter(
    (item) => new Date(`${item.day}T00:00:00Z`) >= currentStart,
  );
  const previousAnalytics = (analytics ?? []).filter((item) => {
    const date = new Date(`${item.day}T00:00:00Z`);
    return (
      date >=
        new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1)) &&
      date < currentStart
    );
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
    clientName: joinedClient?.name ?? "Client workspace",
    periodLabel: monthLabel(currentStart),
    updatedAt: "from the latest connected data",
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
    },
    search: {
      clicks: searchClicks,
      impressions: searchImpressions,
      improved,
      topTen,
      keywords: keywordRows
        .slice(0, 3)
        .map((item) => ({
          keyword: String(item.keyword),
          previous: Number(item.previous_position),
          current: Number(item.current_position),
        })),
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
    topPages: [],
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
