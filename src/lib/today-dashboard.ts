import type { ClientReport, ClientResultsData } from "./client-results";

export function publishedHistory(
  reports: ClientReport[],
  end: string,
  metric: "users" | "clicks",
) {
  return reports
    .filter(
      (report) =>
        report.month.slice(0, 7) <= end.slice(0, 7) &&
        report[metric === "users" ? "usersAvailable" : "clicksAvailable"] !==
          false &&
        Number.isFinite(report[metric]),
    )
    .slice()
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((report) => ({ label: report.monthLabel, value: report[metric] }));
}

export function todayMetrics(data: ClientResultsData) {
  return {
    trafficAvailable: data.isDemo || Boolean(data.traffic.trend?.length),
    searchAvailable: data.isDemo || Boolean(data.search.trend?.length),
    qualificationRate:
      data.leads.total > 0
        ? Math.round((data.leads.qualified / data.leads.total) * 100)
        : null,
    websiteEnquiries: data.leads.sources
      .filter((source) =>
        ["website_form", "website_chatbot"].includes(source.key),
      )
      .reduce((sum, source) => sum + source.value, 0),
    conversationEnquiries: data.leads.sources
      .filter((source) => ["website_chatbot", "whatsapp"].includes(source.key))
      .reduce((sum, source) => sum + source.value, 0),
  };
}
