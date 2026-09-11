"use client";
import { useRouter } from "next/navigation";
import { GrowthAiAssistant } from "./growth-ai-assistant";
import type { ClientResultsData } from "@/lib/client-results";
export function AgentConversation({ data }: { data: ClientResultsData }) {
  const router = useRouter();
  return (
    <div className="dossier-conversation">
      <header className="dossier-heading">
        <h1>Ask Agent</h1>
        <p>What would you like to work on?</p>
      </header>
      <p>
        Answers use your available results. Messages are not yet saved as
        requests for the team.
      </p>
      <GrowthAiAssistant
        data={data}
        initialOpen
        onClose={() => router.push("/client")}
      />
    </div>
  );
}
