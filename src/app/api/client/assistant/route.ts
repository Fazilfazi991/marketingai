import { NextResponse } from "next/server";
import {
  answerDashboardQuestion,
  buildDashboardAssistantContext,
  inferDashboardRange,
  type DashboardConversationMessage,
} from "@/lib/dashboard-assistant";
import { takeDashboardAssistantRequest } from "@/lib/dashboard-assistant-rate-limit";
import { loadClientResults } from "@/lib/client-results";
import { isDemoMode } from "@/lib/demo-mode";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type RequestBody = {
  question?: unknown;
  range?: unknown;
  from?: unknown;
  to?: unknown;
  messages?: unknown;
};

function normalizeMessages(value: unknown): DashboardConversationMessage[] {
  if (!Array.isArray(value)) return [];
  return value
    .slice(-6)
    .filter(
      (item): item is { role: "assistant" | "user"; content: string } =>
        Boolean(item) &&
        typeof item === "object" &&
        ((item as { role?: unknown }).role === "assistant" ||
          (item as { role?: unknown }).role === "user") &&
        typeof (item as { content?: unknown }).content === "string",
    )
    .map((item) => ({ role: item.role, content: item.content.trim().slice(0, 500) }))
    .filter((item) => item.content.length > 0);
}

async function authorizeActor() {
  if (isDemoMode()) return { key: "demo:abc-interiors", role: "client" as const };
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return null;
  const { data: membership, error: membershipError } = await supabase
    .from("client_members")
    .select("client_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (membershipError || !membership) return null;
  return { key: `client-user:${user.id}`, role: "client" as const };
}

export async function POST(request: Request) {
  try {
    const actor = await authorizeActor();
    if (!actor)
      return NextResponse.json(
        { error: "You are not authorized to use this client assistant." },
        { status: 403 },
      );
    const rate = takeDashboardAssistantRequest(actor.key);
    if (!rate.allowed)
      return NextResponse.json(
        { error: "You’ve asked several questions quickly. Please wait a moment and try again." },
        { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
      );

    const body = (await request.json()) as RequestBody;
    const question =
      typeof body.question === "string" ? body.question.trim().slice(0, 500) : "";
    if (!question)
      return NextResponse.json(
        { error: "Ask a question about your dashboard." },
        { status: 400 },
      );
    const results = await loadClientResults({
      range: inferDashboardRange(question, typeof body.range === "string" ? body.range : undefined),
      from: typeof body.from === "string" ? body.from : undefined,
      to: typeof body.to === "string" ? body.to : undefined,
    });
    const context = buildDashboardAssistantContext(results);
    const answer = await answerDashboardQuestion({
      context,
      question,
      messages: normalizeMessages(body.messages),
      role: actor.role,
    });
    console.info("dashboard_assistant_answered", {
      period: context.period.key,
      demo: context.demo,
      historyMessages: normalizeMessages(body.messages).length,
    });
    return NextResponse.json({
      answer,
      period: context.period.label,
      updatedAt: context.period.updatedAt,
      mode: context.demo || !process.env.AI_API_KEY ? "grounded-demo" : "ai",
    });
  } catch (error) {
    console.error("dashboard_assistant_failed", {
      name: error instanceof Error ? error.name : "UnknownError",
    });
    return NextResponse.json(
      { error: "The dashboard assistant is temporarily unavailable. Please try again." },
      { status: 500 },
    );
  }
}
