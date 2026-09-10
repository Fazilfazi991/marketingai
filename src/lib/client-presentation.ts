// Presentation only: never cap or rewrite the underlying growth metric.
export function leadComparison(leads: {
  total: number;
  growth: number | null;
  previousTotal?: number | null;
}) {
  if (leads.growth === null) return "No previous-period baseline";
  const previous = leads.previousTotal;
  if (
    previous !== undefined &&
    previous !== null &&
    previous > 0 &&
    previous < 10 &&
    Math.abs(leads.growth) >= 100
  ) {
    const change = leads.total - previous;
    return `${change >= 0 ? "+" : ""}${change.toLocaleString()} leads vs previous period (${previous} → ${leads.total})`;
  }
  return `${leads.growth >= 0 ? "+" : ""}${leads.growth}% vs previous period`;
}

export function leadSourceLabel(key: string, fallback: string) {
  return (
    (
      {
        whatsapp: "WhatsApp",
        website_chatbot: "Website AI",
        website_form: "Web form",
        other: "Other",
      } as Record<string, string>
    )[key] ?? fallback
  );
}
