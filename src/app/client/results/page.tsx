import { Suspense } from "react";
import { ClientExecutiveOverview } from "@/components/client-executive-overview";
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
  part: "primary" | "metrics" | "insights";
}) {
  let results: ClientResultsData;
  try {
    results = await data;
  } catch {
    return <ResultsRetry />;
  }
  return <ClientExecutiveOverview data={results} part={part} />;
}
export default async function Client({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const query = await searchParams;
  return (
    <>
      {(["primary", "metrics", "insights"] as const).map((part) => (
        <Suspense key={part} fallback={<ResultsSkeleton />}>
          <Part part={part} data={loadClientResults(query, part)} />
        </Suspense>
      ))}
    </>
  );
}
