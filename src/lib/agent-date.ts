// Keep server and browser text identical, using the workspace's existing UAE zone.
export function agentDate(value: string) {
  return new Date(value).toLocaleDateString("en-GB", { timeZone: "Asia/Dubai" });
}

export function agentTime(value: string, compact = false) {
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "Asia/Dubai",
    ...(compact
      ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" } as const
      : {}),
  });
}
