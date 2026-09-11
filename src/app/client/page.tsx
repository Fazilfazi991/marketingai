import { Suspense } from "react";
import { ClientExecutiveOverview } from "@/components/client-executive-overview";
import { LazyAssistant } from "@/components/lazy-assistant";
import { ResultsRetry, ResultsSkeleton } from "@/components/results-feedback";
import {
  loadClientResults,
  type ClientResultsData,
} from "@/lib/client-results";
async function Part({
  data,
  part,
}: {
  data: Promise<ClientResultsData>;
  part: "primary" | "metrics" | "insights" | "assistant";
}) {
  let results: ClientResultsData;
  try {
    results = await data;
  } catch {
    return <ResultsRetry />;
  }
  return part === "assistant" ? (
    <LazyAssistant data={results} />
  ) : (
    <ClientExecutiveOverview data={results} part={part} />
  );
}
export default async function Client({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const query = await searchParams;
  return (
    <>
      {(["primary", "metrics", "insights", "assistant"] as const).map(
        (part) => (
          <Suspense key={part} fallback={<ResultsSkeleton />}>
            <Part
              part={part}
              data={loadClientResults(
                query,
                part === "assistant" ? "all" : part,
              )}
            />
          </Suspense>
        ),
      )}
    </>
  );
}
