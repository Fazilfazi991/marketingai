import { createClient } from "@/lib/supabase/server";
import { loadAgentWorkspace } from "@/lib/agent-data";
import { AgentService } from "@/lib/agent-service";
import { isDemoMode } from "@/lib/demo-mode";
import { uuidPattern, validMessage } from "@/lib/agent-workflow";
export const dynamic = "force-dynamic";
const respond = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "private, no-store" },
  });
export async function GET(request: Request) {
  try {
    return respond(
      await loadAgentWorkspace(
        new URL(request.url).searchParams.get("staff") === "true",
      ),
    );
  } catch {
    return respond(
      { error: "Sign in with an authorized workspace account." },
      403,
    );
  }
}
export async function POST(request: Request) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return respond({ error: "Invalid request origin." }, 403);
  if (isDemoMode())
    return respond(
      {
        error:
          "This is a read-only demo. Sign in to the connected workspace to send.",
      },
      403,
    );
  const raw = await request.text();
  if (raw.length > 20000)
    return respond({ error: "Message is too large." }, 413);
  let input: Record<string, unknown>;
  try {
    input = JSON.parse(raw);
    if (!input || Array.isArray(input) || typeof input !== "object")
      throw new Error();
  } catch {
    return respond({ error: "Invalid request." }, 400);
  }
  if (
    Object.keys(input).some(
      (k) => !["body", "key", "conversation", "action", "value"].includes(k),
    ) ||
    typeof input.key !== "string" ||
    !uuidPattern.test(input.key)
  )
    return respond({ error: "Invalid submission." }, 400);
  if (
    input.conversation != null &&
    (typeof input.conversation !== "string" ||
      !uuidPattern.test(input.conversation))
  )
    return respond({ error: "Invalid conversation." }, 400);
  const staff = input.action !== undefined;
  if (!staff && !validMessage(input.body))
    return respond(
      { error: "Enter a message between 1 and 4,000 characters." },
      400,
    );
  if (
    staff &&
    (!input.conversation ||
      typeof input.action !== "string" ||
      ![
        "reply",
        "note",
        "status",
        "assign",
        "category",
        "request",
        "question",
      ].includes(input.action) ||
      typeof input.value !== "string" ||
      input.value.length > 4000)
  )
    return respond({ error: "Invalid team action." }, 400);
  try {
    const db = await createClient();
    const {
      data: { user },
    } = await db.auth.getUser();
    if (!user)
      return respond(
        {
          error:
            "Your session ended. Sign in again; your draft has not been cleared.",
        },
        401,
      );
    const agent = new AgentService(db);
    const result = staff
      ? await agent.manage(
          input.conversation as string,
          input.action as string,
          input.value as string,
          input.key,
        )
      : await agent.send(
          input.body as string,
          input.key,
          (input.conversation as string | null) ?? null,
        );
    if (result.error)
      return respond(
        {
          error:
            result.error.code === "42501"
              ? "You don’t have permission for this conversation or action."
              : "We couldn’t save this. Your draft is still here. Retry the same submission.",
        },
        result.error.code === "42501" ? 403 : 400,
      );
    // A successful transaction is acknowledged separately from reload, so a read failure
    // cannot trick the user into resending a committed message with a new key.
    return respond({ conversation: result.data, saved: true });
  } catch {
    return respond(
      {
        error:
          "Connection interrupted. Your draft is still here. Please retry.",
      },
      503,
    );
  }
}
