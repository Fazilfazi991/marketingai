import { AppShell } from "@/components/app-shell";
import { ClientPortalSection } from "@/components/client-portal-section";
import { ClientResultsDashboard } from "@/components/client-results-dashboard";
import { loadClientResults } from "@/lib/client-results";

const labels: Record<string, string> = {
  leads: "Leads",
  traffic: "Traffic & SEO",
  reports: "Reports",
};

export default async function Section({
  params,
  searchParams,
}: {
  params: Promise<{ section: string }>;
  searchParams: Promise<{ range?: string; from?: string; to?: string; source?: string }>;
}) {
  const [{ section }, query] = await Promise.all([params, searchParams]);
  const data = await loadClientResults(query);
  if (section === "leads" || section === "traffic")
    return (
      <AppShell
        role="client"
        title={labels[section]}
        subtitle={`${data.clientName} · verified growth results.`}
      >
        <ClientResultsDashboard data={data} view={section} />
      </AppShell>
    );
  return (
    <AppShell
      role="client"
      title="Reports"
      subtitle={`${data.clientName} · published growth reports.`}
    >
      <ClientPortalSection data={data} />
    </AppShell>
  );
}
