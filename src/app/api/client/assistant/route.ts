import { NextResponse } from "next/server";
import { answerDashboardQuestion } from "@/lib/dashboard-assistant";
import { loadClientResults } from "@/lib/client-results";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { question?: unknown; range?: unknown; from?: unknown; to?: unknown };
    const question = typeof body.question === "string" ? body.question.trim().slice(0, 500) : "";
    if (!question) return NextResponse.json({ error: "Ask a question about your dashboard." }, { status: 400 });
    const data = await loadClientResults({ range: typeof body.range === "string" ? body.range : undefined, from: typeof body.from === "string" ? body.from : undefined, to: typeof body.to === "string" ? body.to : undefined });
    return NextResponse.json({ answer: answerDashboardQuestion(data, question), period: data.periodLabel, updatedAt: data.updatedAt });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "The dashboard assistant is unavailable." }, { status: 500 });
  }
}
