import { loadClientResults } from "@/lib/client-results";
import { AgentConversation } from "@/components/agent-conversation";
export default async function Agent({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  return (
    <AgentConversation data={await loadClientResults(await searchParams)} />
  );
}
