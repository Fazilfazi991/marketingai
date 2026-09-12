import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Future model adapters receive a vetted context, not raw integration credentials.
 * Requests are always human-supervised, regardless of model/provider. */
export type AgentBusinessContext = {
  clientId: string;
  name: string;
  description?: string;
  services: string[];
  locations: string[];
  targetCustomers?: string;
  website?: string;
  tone?: string;
  verifiedFaqs: { question: string; answer: string }[];
  goals?: string[]; // Not structured in the current business schema; Phase 7 gap.
};
export interface AgentProvider {
  answer(input: {
    message: string;
    context: AgentBusinessContext;
  }): Promise<
    | { state: "pending_team" }
    | { state: "draft_for_review"; text: string; evidence: string[] }
  >;
}
export const pendingTeamProvider: AgentProvider = {
  async answer() {
    return { state: "pending_team" };
  },
};

/** Database transaction owns classification + receipt + persistence. No fake model text.
 * Future routing/context retrieval sits here; the UI and schema remain provider independent. */
export class AgentService {
  constructor(private readonly db: SupabaseClient) {}
  async send(body: string, key: string, conversation: string | null) {
    return this.db.rpc("agent_send", {
      p_body: body.trim(),
      p_key: key,
      p_conversation: conversation,
    });
  }
  async manage(
    conversation: string,
    action: string,
    value: string,
    key: string,
  ) {
    return this.db.rpc("agent_manage", {
      p_conversation: conversation,
      p_action: action,
      p_value: value,
      p_key: key,
    });
  }
}
