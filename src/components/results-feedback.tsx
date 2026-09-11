"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
export function ResultsRetry({
  label = "This section could not be loaded.",
}: {
  label?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <div className="results-retry" role="alert">
      <p>{label}</p>
      <button
        type="button"
        disabled={pending}
        onClick={() => startTransition(() => router.refresh())}
      >
        {pending ? "Retrying…" : "Retry"}
      </button>
    </div>
  );
}
export function ResultsSkeleton({
  label = "Loading your results…",
}: {
  label?: string;
}) {
  return (
    <div className="results-skeleton" role="status" aria-label={label}>
      <span>{label}</span>
      <i />
      <i />
      <i />
    </div>
  );
}
