import { ClientPortalSection } from "@/components/client-portal-section";
import { ClientResultsDashboard } from "@/components/client-results-dashboard";
import { loadClientResults, type ResultRangeInput } from "@/lib/client-results";
import { NotificationFeed } from "@/components/client-notifications";
import { LazyAssistant } from "@/components/lazy-assistant";
import { ResultsRetry } from "@/components/results-feedback";
import { notFound } from "next/navigation";
export default async function Section({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<ResultRangeInput>;
}) {
  const [{ section }, query] = await Promise.all([params, searchParams]);
  if (section !== "leads" && section !== "traffic" && section !== "reports")
    notFound();
  const data = await loadClientResults(query, section);
  return (
    <>
      <h2 className="client-name">{data.clientName}</h2>
      <NotificationFeed data={data} />
      {data.unavailableSources?.length ? (
        <ResultsRetry />
      ) : section === "reports" ? (
        <ClientPortalSection data={data} />
      ) : (
        <ClientResultsDashboard data={data} view={section} />
      )}
      <LazyAssistant data={data} />
    </>
  );
}
