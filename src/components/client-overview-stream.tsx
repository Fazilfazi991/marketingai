import { Suspense } from "react";
import {
  ClientExecutiveOverview,
  ClientSourceDonut,
} from "./client-executive-overview";
import { ResultsSkeleton } from "./results-feedback";
import {
  loadClientResults,
  type ClientResultsData,
  type ResultRangeInput,
} from "@/lib/client-results";

async function Part({
  promise,
  part,
}: {
  promise: Promise<ClientResultsData>;
  part: "primary" | "metrics" | "insights";
}) {
  return <ClientExecutiveOverview data={await promise} part={part} />;
}
async function Sources({ promise }: { promise: Promise<ClientResultsData> }) {
  return <ClientSourceDonut data={await promise} />;
}
export function ClientOverviewStream({ query }: { query: ResultRangeInput }) {
  const primary = loadClientResults(query, "primary");
  const metrics = loadClientResults(query, "metrics");
  const insights = loadClientResults(query, "insights");
  return (
    <>
      <Suspense
        fallback={<ResultsSkeleton label="Loading leads and next focus…" />}
      >
        <Part promise={primary} part="primary" />
      </Suspense>
      <Suspense fallback={<ResultsSkeleton label="Loading performance…" />}>
        <Part promise={metrics} part="metrics" />
      </Suspense>
      <Suspense fallback={<ResultsSkeleton label="Loading lead sources…" />}>
        <Sources promise={primary} />
      </Suspense>
      <Suspense
        fallback={<ResultsSkeleton label="Loading insights and reports…" />}
      >
        <Part promise={insights} part="insights" />
      </Suspense>
    </>
  );
}
