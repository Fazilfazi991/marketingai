import { AppShell } from "@/components/app-shell";
import { AgentInbox } from "@/components/agent-inbox";
import { loadAgentWorkspace } from "@/lib/agent-data";
export default async function Requests() {
  const data = await loadAgentWorkspace(true);
  return (
    <AppShell
      role={data.isAdmin ? "admin" : "staff"}
      title="Client requests"
      subtitle="Conversations, review and progress. All work remains human-supervised."
    >
      <AgentInbox initial={data} />
    </AppShell>
  );
}
