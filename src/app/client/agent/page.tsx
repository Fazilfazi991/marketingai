import { loadAgentWorkspace } from "@/lib/agent-data";
import { AgentConversation } from "@/components/agent-conversation";
export default async function Agent() {
  return <AgentConversation initial={await loadAgentWorkspace()} />;
}
