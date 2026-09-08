type WindowState = { count: number; resetAt: number };
const windows = new Map<string, WindowState>();

export function takeDashboardAssistantRequest(
  actorKey: string,
  now = Date.now(),
  limit = 20,
  windowMs = 60_000,
) {
  const current = windows.get(actorKey);
  if (!current || current.resetAt <= now) {
    windows.set(actorKey, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }
  if (current.count >= limit)
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((current.resetAt - now) / 1000)),
    };
  current.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export function resetDashboardAssistantRateLimits() {
  windows.clear();
}
