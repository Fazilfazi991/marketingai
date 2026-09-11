"use client";

import { ChevronLeft, Clock3 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useContext, useTransition, type ReactNode } from "react";
import { ClientRangeContext } from "./client-range-state";
import type { ClientResultsData } from "@/lib/client-results";
import { resultHref } from "@/lib/result-consistency";

type HeaderData = Pick<
  ClientResultsData,
  | "clientName"
  | "periodLabel"
  | "rangeKey"
  | "rangeStart"
  | "rangeEnd"
  | "updatedAt"
  | "isDemo"
  | "loadedSources"
>;

export function useClientRange(data: HeaderData) {
  const router = useRouter(),
    pathname = usePathname(),
    params = useSearchParams();
  const [localPending, localTransition] = useTransition();
  const shared = useContext(ClientRangeContext);
  const pending = shared?.pending ?? localPending;
  const startTransition = shared?.startTransition ?? localTransition;
  const navigate = (
    range: string,
    from = data.rangeStart,
    to = data.rangeEnd,
  ) => {
    if (pending) return;
    shared?.setRequested(range);
    const query = new URLSearchParams(params.toString());
    query.set("range", range);
    query.delete("from");
    query.delete("to");
    if (range === "custom") {
      query.set("from", from);
      query.set("to", to);
    }
    startTransition(() =>
      router.push(`${pathname}?${query}`, { scroll: false }),
    );
  };
  return {
    pending,
    navigate,
    selectedRange: pending
      ? (shared?.requested ?? data.rangeKey)
      : data.rangeKey,
  };
}

export function ClientPageHeader({
  data,
  title,
  overview = false,
  control,
  periodLabel = data.periodLabel,
}: {
  data: HeaderData;
  title: string;
  overview?: boolean;
  control?: ReactNode;
  periodLabel?: string;
}) {
  const { pending, navigate, selectedRange } = useClientRange(data);
  return (
    <header
      className="client-page-header"
      aria-busy={pending}
      data-results-range={data.rangeKey}
    >
      {!overview && (
        <Link className="client-back" href={resultHref("/client", data)}>
          <ChevronLeft size={17} />
          Overview
        </Link>
      )}
      <div className="client-header-row">
        <div className="client-header-title">
          <h1>{title}</h1>
          <p>
            {!overview && <>{data.clientName} · </>}
            {periodLabel}
          </p>
        </div>
        <div className="client-header-control">
          {control ?? (
            <select
              aria-label="Date range"
              value={selectedRange}
              disabled={pending}
              onChange={(event) => navigate(event.target.value)}
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="month">This month</option>
              <option value="last-month">Last month</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="year">This year</option>
              <option value="custom">Custom range</option>
            </select>
          )}
        </div>
      </div>
      <div className="client-header-meta">
        <span role="status">
          {pending
            ? "Updating results…"
            : data.isDemo
              ? "Demo data"
              : "Published results"}
        </span>
        <details className="client-freshness">
          <summary aria-label="Data freshness">
            <Clock3 size={13} />
            <span>Data freshness</span>
          </summary>
          <p>
            {data.loadedSources && !data.loadedSources.includes("health") && !data.isDemo
              ? "Sync timestamps are available in Traffic & SEO."
              : `Updated ${data.updatedAt}.`}{" "}
            {data.isDemo
              ? "Illustrative demo totals; no daily history is invented."
              : "Only available, authorized source data is shown."}
          </p>
        </details>
      </div>
      {!control && data.rangeKey === "custom" && (
        <div className="client-custom-range">
          <label>
            From
            <input
              type="date"
              value={data.rangeStart}
              max={data.rangeEnd}
              disabled={pending}
              onChange={(event) =>
                navigate("custom", event.target.value, data.rangeEnd)
              }
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={data.rangeEnd}
              min={data.rangeStart}
              disabled={pending}
              onChange={(event) =>
                navigate("custom", data.rangeStart, event.target.value)
              }
            />
          </label>
        </div>
      )}
    </header>
  );
}
