/** Shared presentation/validation contracts only; no credentials or provider calls. */
export const requestStatuses = {
  received: "Received",
  reviewing: "Reviewing",
  in_progress: "In Progress",
  needs_approval: "Needs Your Approval",
  completed: "Completed",
  cancelled: "Cancelled",
} as const;
export const requestCategories = {
  website: "Website",
  seo: "SEO",
  google_search: "Google / Search",
  whatsapp: "WhatsApp",
  chatbot: "Chatbot",
  analytics: "Analytics",
  general: "General",
} as const;
export type AgentTopic = {
  id: string;
  client_id: string;
  created_by: string;
  title: string;
  kind: "question" | "request";
  status: string;
  assigned_user_id: string | null;
  created_at: string;
  updated_at: string;
  clientName?: string;
};
export type AgentMessage = {
  id: string;
  conversation_id: string;
  sender_type: "client" | "staff" | "system";
  body: string;
  status: string;
  created_at: string;
};
export type AgentRequest = {
  id: string;
  conversation_id: string;
  title: string;
  description: string;
  status: string;
  request_type: string;
  latest_update: string | null;
  created_at: string;
  updated_at: string;
};
export type RequestEvent = {
  id: string;
  request_id: string;
  status: string;
  body: string;
  created_at: string;
};
export type InternalNote = {
  id: string;
  conversation_id: string;
  body: string;
  created_at: string;
};
export type AgentWorkspace = {
  topics: AgentTopic[];
  messages: AgentMessage[];
  requests: AgentRequest[];
  events: RequestEvent[];
  notes: InternalNote[];
  owners: { id: string; name: string }[];
  isAdmin: boolean;
  isDemo: boolean;
  unavailable: boolean;
  scope: string;
  clientName: string;
  notifications: { id: string; title: string }[];
};
export const agentPrompts = [
  "How is my website performing?",
  "What should we improve this week?",
  "Find my best SEO opportunities.",
  "Why did my Google traffic change?",
  "Which pages need attention?",
  "What are customers asking about?",
  "I want to promote a new service.",
  "I need a change on my website.",
];
export const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export function validMessage(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 4000
  );
}
export function statusLabel(status: string) {
  return (
    requestStatuses[status as keyof typeof requestStatuses] ??
    status.replaceAll("_", " ")
  );
}
