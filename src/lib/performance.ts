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
  const operation = url.pathname.startsWith("/rest/v1/")
    ? `db.${url.pathname.split("/").slice(3).join(".")}`
    : `auth.${url.pathname.split("/").at(-1)}`;
  const timeout = AbortSignal.timeout(8000);
  const signal = init?.signal
    ? AbortSignal.any([init.signal, timeout])
    : timeout;
  return timed(operation, () =>
    fetch(input, { ...init, signal, cache: "no-store" }),
  );
};
