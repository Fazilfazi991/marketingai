import { ClientPortalSection } from "@/components/client-portal-section";
import { ClientResultsDashboard } from "@/components/client-results-dashboard";
import { NotificationFeed } from "@/components/client-notifications";
import { loadClientResults } from "@/lib/client-results";
export default async function Section({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    source?: string;
  }>;
}) {
  const [{ section }, query] = await Promise.all([params, searchParams]);
  const view =
    section === "leads" || section === "traffic" ? section : "reports";
  const data = await loadClientResults(query, view);
  return (
    <>
      <NotificationFeed data={data} />
      {view === "reports" ? (
        <ClientPortalSection data={data} />
      ) : (
        <ClientResultsDashboard data={data} view={view} />
      )}
    </>
  );
}
