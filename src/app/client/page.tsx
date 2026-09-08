import { AppShell } from "@/components/app-shell";import {ClientResultsDashboard} from "@/components/client-results-dashboard";
import {loadClientResults} from "@/lib/client-results";
export default async function Client(){const data=await loadClientResults();return <AppShell role="client" title={data.clientName} subtitle={`Your growth results for ${data.periodLabel}.`}><ClientResultsDashboard data={data}/></AppShell>}
