export type Ranking = {
  keyword: string;
  previous: number;
  current: number;
  comparable?: boolean;
};

export function keywordMovement(item: Ranking) {
  if (
    item.comparable === false ||
    !Number.isFinite(item.previous) ||
    !Number.isFinite(item.current) ||
    item.previous <= 0 ||
    item.current <= 0
  )
    return "Unavailable";
  return item.current < item.previous
    ? "Improved"
    : item.current > item.previous
      ? "Declined"
      : "Stable";
}

export function keywordCounts(items: Ranking[]) {
  return {
    total: items.length,
    improved: items.filter((i) => keywordMovement(i) === "Improved").length,
    declined: items.filter((i) => keywordMovement(i) === "Declined").length,
    stable: items.filter((i) => keywordMovement(i) === "Stable").length,
  };
}

export function pageIdentity(value: string) {
  const clean = value.trim();
  if (!clean) return "";
  try {
    return (
      new URL(clean, "https://page.invalid").pathname.replace(/\/$/, "") || "/"
    );
  } catch {
    return clean;
  }
}

export function pageLabel(url: string, title?: string | null) {
  if (title?.trim()) return title.trim();
  if (url.trim() && !url.includes("/") && !url.includes(":")) return url.trim();
  const path = pageIdentity(url);
  if (path === "/") return "Home";
  try {
    return decodeURIComponent(path) || url.trim() || "Page not identified";
  } catch {
    return path || url.trim() || "Page not identified";
  }
}

export function resultHref(
  path: string,
  period: { rangeKey: string; rangeStart: string; rangeEnd: string },
  extra: Record<string, string> = {},
) {
  // Carry the resolved dates, not a relative range that could change at midnight.
  const query = new URLSearchParams({
    range: "custom",
    from: period.rangeStart,
    to: period.rangeEnd,
    ...extra,
  });
  return `${path}?${query}`;
}

export function dailySeries(
  rows: Array<{ day: string; value: number }>,
  start: string,
  end: string,
) {
  const values = new Map<string, number>();
  for (const row of rows)
    if (row.day >= start && row.day <= end && Number.isFinite(row.value))
      values.set(row.day, (values.get(row.day) ?? 0) + row.value);
  return [...values]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([label, value]) => ({ label, value }));
}
