/** Timings contain operation names and durations only, never URLs, cookies or user data. */
export async function timed<T>(
  operation: string,
  run: () => PromiseLike<T>,
): Promise<T> {
  const start = performance.now();
  try {
    return await run();
  } finally {
    console.info(
      "growth_timing",
      JSON.stringify({
        operation,
        ms: Math.round(performance.now() - start),
        region: process.env.VERCEL_REGION ?? "local",
      }),
    );
  }
}

export const measuredFetch: typeof fetch = async (input, init) => {
  const url = new URL(
    typeof input === "string"
      ? input
      : input instanceof URL
        ? input.href
        : input.url,
  );
  const databaseOperation = url.pathname.match(
    /^\/rest\/v1\/(?:rpc\/)?([a-zA-Z0-9_]+)$/,
  )?.[1];
  const authOperation = url.pathname.match(
    /^\/auth\/v1\/(user|token|logout|health|signup|recover|verify|\.well-known\/jwks\.json)$/,
  )?.[1];
  const operation = databaseOperation
    ? `db.${databaseOperation}`
    : authOperation
      ? `auth.${authOperation}`
      : "supabase.request";
  const timeout = AbortSignal.timeout(8000);
  const callerSignal =
    init?.signal ?? (input instanceof Request ? input.signal : undefined);
  const signal = callerSignal
    ? AbortSignal.any([callerSignal, timeout])
    : timeout;
  return timed(operation, () =>
    fetch(input, { ...init, signal, cache: "no-store" }),
  );
};
