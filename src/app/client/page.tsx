import { loadClientResults } from "@/lib/client-results";
import { AgentToday } from "@/components/agent-today";

export default async function Today({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const data = await loadClientResults(await searchParams, "today");
  return <AgentToday data={data} />;
}
