export type MetricRow = { metrics: unknown };
export type LeadRow = { source: string; lead_quality: string; status: string };

export function sumMetric(rows: MetricRow[] | null, ...keys: string[]) {
  if (!rows?.length) return null;
  let sum = 0;
  for (const row of rows) {
    const metrics = (row.metrics ?? {}) as Record<string, unknown>;
    const value = keys.map(key => metrics[key]).find(value => typeof value === "number" && Number.isFinite(value) && value >= 0);
    if (typeof value !== "number") return null;
    sum += value;
  }
  return sum;
}

export function percentChange(current: number | null, previous: number | null) {
  if (current === null || previous === null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export function qualifiedLeadCount(leads: LeadRow[] | null) {
  return (leads ?? []).filter(lead =>
    ["qualified", "high_intent"].includes(lead.lead_quality) || ["qualified", "won"].includes(lead.status),
  ).length;
}

export function leadingSource(leads: LeadRow[] | null) {
  const counts = new Map<string, number>();
  for (const lead of leads ?? []) counts.set(lead.source, (counts.get(lead.source) ?? 0) + 1);
  const source = [...counts].sort((a, b) => b[1] - a[1])[0];
  return source ? { source: source[0], count: source[1] } : null;
}

export function sourceLabel(source: string) {
  return ({ website_form: "website forms", website_chatbot: "website AI", whatsapp: "WhatsApp", google_business: "Google Business", instagram: "Instagram", facebook: "Facebook", phone: "phone calls", manual: "manually recorded enquiries" } as Record<string, string>)[source] ?? "other sources";
}
