import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { AgentConversation, RequestDetail } from "./agent-conversation";
import { AgentInbox } from "./agent-inbox";
import type { AgentWorkspace } from "../lib/agent-workflow";
vi.mock("./client-notifications", () => ({
  WorkflowNotificationFeed: () => null,
}));
const empty: AgentWorkspace = {
  topics: [],
  messages: [],
  requests: [],
  events: [],
  notes: [],
  owners: [],
  notifications: [],
  isAdmin: false,
  isDemo: false,
  unavailable: false,
  scope: "qa:client-a",
  clientName: "QA Business",
};
const time = "2026-09-11T12:00:00Z";
const filled: AgentWorkspace = {
  ...empty,
  topics: [
    {
      id: "topic",
      client_id: "client",
      created_by: "user",
      title: "Add office renovation",
      kind: "request",
      status: "pending",
      assigned_user_id: "owner",
      created_at: time,
      updated_at: time,
      clientName: "QA Business",
    },
  ],
  messages: [
    {
      id: "message",
      conversation_id: "topic",
      sender_type: "client",
      body: "Please add office renovation to the website.",
      status: "pending_team",
      created_at: time,
    },
    {
      id: "receipt",
      conversation_id: "topic",
      sender_type: "system",
      body: "Our team will review this.",
      status: "saved",
      created_at: time,
    },
  ],
  requests: [
    {
      id: "request",
      conversation_id: "topic",
      title: "Add office renovation",
      description: "Please add office renovation to the website.",
      status: "needs_approval",
      request_type: "website",
      latest_update: "Draft ready for your review.",
      created_at: time,
      updated_at: time,
    },
  ],
  events: [
    {
      id: "event",
      request_id: "request",
      status: "received",
      body: "Request received",
      created_at: time,
    },
  ],
  notes: [
    {
      id: "note",
      conversation_id: "topic",
      body: "STAFF ONLY PRIVATE NOTE",
      created_at: time,
    },
  ],
};
describe("Growth Agent UI states", () => {
  it("renders honest empty state without fake history or launcher", () => {
    const html = renderToStaticMarkup(<AgentConversation initial={empty} />);
    expect(html).toContain("What would you like to work on?");
    expect(html).toContain("Message your growth team");
    expect(html).not.toContain("growth-ai-launcher");
    expect(html).not.toContain("Growth Agent active");
  });
  it("renders persisted messages and a linked request receipt, never internal notes", () => {
    const html = renderToStaticMarkup(<AgentConversation initial={filled} />);
    expect(html).toContain("Please add office renovation");
    expect(html).toContain("View request");
    expect(html).toContain("Needs Your Approval");
    expect(html).not.toContain("STAFF ONLY PRIVATE NOTE");
  });
  it("renders real status history and latest update", () => {
    const html = renderToStaticMarkup(
      <RequestDetail request={filled.requests[0]} data={filled} />,
    );
    expect(html).toContain("Request received");
    expect(html).toContain("Draft ready for your review.");
  });
  it("makes client replies and internal notes explicitly different", () => {
    const html = renderToStaticMarkup(<AgentInbox initial={filled} />);
    expect(html).toContain("Reply to client");
    expect(html).toContain("Internal note — staff only");
    expect(html).toContain("STAFF ONLY PRIVATE NOTE");
    expect(html).not.toContain(">Owner<");
  });
  it("shows read-only demo warning and no invented incoming work", () => {
    const html = renderToStaticMarkup(
      <AgentInbox initial={{ ...empty, isDemo: true }} />,
    );
    expect(html).toContain("Read-only demo");
    expect(html).toContain("No matching conversations");
  });
});
