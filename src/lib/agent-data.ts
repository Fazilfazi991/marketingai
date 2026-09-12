import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/demo-mode";
import type { AgentWorkspace, AgentTopic } from "./agent-workflow";

// Follow PostgREST ranges rather than silently losing history at its row cap.
async function allRows<T>(
  query: (
    start: number,
    end: number,
  ) => PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const result: T[] = [];
  for (let start = 0; ; start += 250) {
    const page = await query(start, start + 249);
    if (page.error) return { data: null, error: page.error };
    result.push(...(page.data ?? []));
    if (!page.data || page.data.length < 250)
      return { data: result, error: null };
  }
}

export async function loadAgentWorkspace(
  staff = false,
): Promise<AgentWorkspace> {
  const empty: AgentWorkspace = {
    topics: [],
    messages: [],
    requests: [],
    events: [],
    notes: [],
    owners: [],
    notifications: [],
    isAdmin: false,
    isDemo: isDemoMode(),
    unavailable: false,
    scope: "",
    clientName: "Your business",
  };
  if (empty.isDemo) return empty; // Demo is explicitly read-only, never fake persistence.
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) throw new Error("Sign in to open your growth workspace.");
  empty.scope = user.id;
  if (staff) {
    const { data: roles, error } = await db
      .from("organization_members")
      .select("role,organization_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .in("role", ["admin", "staff"]);
    if (error || !roles?.length) throw new Error("Team access required.");
    empty.isAdmin = roles.some((r) => r.role === "admin");
    // Owner list is only for the admin's organizations; RPC rechecks the chosen topic's org.
    const adminOrgs = roles
      .filter((r) => r.role === "admin")
      .map((r) => r.organization_id);
    if (adminOrgs.length) {
      const { data: owners } = await db.rpc("agent_owners");
      empty.owners = owners ?? [];
    }
  } else {
    const { data: memberships, error } = await db
      .from("client_members")
      .select("client_id,clients(name)")
      .eq("user_id", user.id)
      .eq("role", "client");
    if (error || memberships?.length !== 1)
      throw new Error(
        "One active client workspace is required. Please contact your team.",
      );
    empty.clientName =
      (memberships[0].clients as unknown as { name: string } | null)?.name ??
      "Your business";
    empty.scope += `:${memberships[0].client_id}`;
    const { data: notices } = await db
      .from("notifications")
      .select("id,title")
      .eq("user_id", user.id)
      .in("title", ["Your growth team replied", "Your request was updated"])
      .order("created_at", { ascending: false })
      .limit(30);
    empty.notifications = notices ?? [];
  }
  // RLS is authoritative; no service role or caller-selected tenant.
  const topics = await allRows((start, end) =>
    db
      .from("agent_conversations")
      .select(
        "id,client_id,created_by,assigned_user_id,title,kind,status,created_at,updated_at,clients(name)",
      )
      .order("updated_at", { ascending: false })
      .order("id")
      .range(start, end),
  );
  if (topics.error) return { ...empty, unavailable: true };
  const rows: AgentTopic[] = (topics.data ?? []).map((t) => ({
    ...t,
    clientName:
      (t.clients as unknown as { name: string } | null)?.name ?? "Client",
  }));
  if (!rows.length) return empty;
  const ids = rows.map((t) => t.id);
  const [messages, requests, notes] = await Promise.all([
    allRows((start, end) =>
      db
        .from("agent_messages")
        .select("id,conversation_id,sender_type,body,status,created_at")
        .in("conversation_id", ids)
        .order("created_at")
        .order("id")
        .range(start, end),
    ),
    allRows((start, end) =>
      db
        .from("client_requests")
        .select(
          "id,conversation_id,title,description,status,request_type,latest_update,created_at,updated_at",
        )
        .in("conversation_id", ids)
        .order("created_at", { ascending: false })
        .order("id")
        .range(start, end),
    ),
    staff
      ? allRows((start, end) =>
          db
            .from("agent_internal_notes")
            .select("id,conversation_id,body,created_at")
            .in("conversation_id", ids)
            .order("created_at")
            .order("id")
            .range(start, end),
        )
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (messages.error || requests.error || notes.error)
    return { ...empty, unavailable: true };
  const requestIds = (requests.data ?? []).map((r) => r.id);
  const events = requestIds.length
    ? await allRows((start, end) =>
        db
          .from("request_events")
          .select("id,request_id,status,body,created_at")
          .in("request_id", requestIds)
          .order("created_at")
          .order("id")
          .range(start, end),
      )
    : { data: [], error: null };
  if (events.error) return { ...empty, unavailable: true };
  return {
    ...empty,
    topics: rows,
    messages: messages.data ?? [],
    requests: requests.data ?? [],
    notes: notes.data ?? [],
    events: events.data ?? [],
  };
}
