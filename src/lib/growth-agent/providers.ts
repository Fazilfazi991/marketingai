import "server-only";
import type { AgentProvider } from "../agent-service";
import type { GroundedAgentProvider } from "./contracts";
import { buildGrowthPrompt, type GroundedInput } from "./prompt";
import { modelCatalog, type ModelConfiguration, type ModelSlot } from "./model-config";

export type ProviderFailureCode = "disabled" | "timeout" | "unavailable" | "authentication" | "invalid_request" | "malformed";
export class ProviderFailure extends Error {
  constructor(readonly code: ProviderFailureCode) { super(`Growth provider: ${code}`); }
}
export type TokenUsage = { input: number | null; output: number | null; estimatedCostUsd: number | null };
export type ProviderReply = { output: unknown; usage: TokenUsage };
export interface RoutedAgentProvider extends GroundedAgentProvider {
  call(input: GroundedInput, signal: AbortSignal): Promise<ProviderReply>;
}
const record = (v: unknown): Record<string, unknown> => v && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {};
const count = (v: unknown) => typeof v === "number" && Number.isSafeInteger(v) && v >= 0 ? v : null;
async function boundedResponse(response: Response) {
  if (!response.body) throw new ProviderFailure("malformed");
  const reader = response.body.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.length;
      if (size > 65536) throw new ProviderFailure("malformed");
      chunks.push(value);
    }
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
  const combined = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { combined.set(chunk, offset); offset += chunk.length; }
  try { return JSON.parse(new TextDecoder().decode(combined)) as unknown; } catch { throw new ProviderFailure("malformed"); }
}

/** Shared transport only. Domain analysis/routing stays independent of vendors. */
abstract class ChatProvider implements AgentProvider, RoutedAgentProvider {
  #configuration: ModelConfiguration;
  constructor(readonly slot: ModelSlot, configuration: ModelConfiguration, private readonly transport: typeof fetch = fetch) {
    this.#configuration = structuredClone(configuration);
  }
  async answer(): Promise<{ state: "pending_team" }> { return { state: "pending_team" }; }
  async generateGroundedAnswer(input: GroundedInput, signal: AbortSignal) { return (await this.call(input, signal)).output; }
  async call(input: GroundedInput, signal: AbortSignal): Promise<ProviderReply> {
    const c = this.#configuration, selected = c.models[this.slot], verified = modelCatalog[this.slot];
    if (!c.callsEnabled || !selected.available || !selected.apiKey || verified.blocked || !verified.model || selected.model !== verified.model || selected.endpoint !== verified.endpoint || selected.provider !== verified.provider) throw new ProviderFailure("disabled");
    if (signal.aborted) throw new ProviderFailure("timeout");
    const body = { model: selected.model, messages: buildGrowthPrompt(input), stream: false,
      response_format: { type: "json_object" }, max_tokens: 4096,
      thinking: { type: "enabled" }, reasoning_effort: this.slot === "deepseekPro" ? "high" : "low" };
    let response: Response;
    try {
      response = await this.transport(selected.endpoint, { method: "POST", redirect: "error", signal,
        headers: { Authorization: `Bearer ${selected.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    } catch { throw new ProviderFailure(signal.aborted ? "timeout" : "unavailable"); }
    if (!response.ok) {
      await response.body?.cancel().catch(() => {});
      throw new ProviderFailure([401, 403].includes(response.status) ? "authentication" : [408, 429].includes(response.status) || response.status >= 500 ? "unavailable" : "invalid_request");
    }
    const raw = record(await boundedResponse(response));
    const choices = raw.choices;
    if (!Array.isArray(choices) || choices.length !== 1) throw new ProviderFailure("malformed");
    const choice = record(choices[0]), message = record(choice.message);
    if (choice.finish_reason !== "stop" || message.tool_calls || message.function_call || message.refusal || typeof message.content !== "string" || message.content.length > 12000) throw new ProviderFailure("malformed");
    let output: unknown;
    try { output = JSON.parse(message.content); } catch { throw new ProviderFailure("malformed"); }
    const usage = record(raw.usage);
    // No guessed pricing: cache/peak rates and account billing are not yet verified.
    return { output, usage: { input: count(usage.prompt_tokens), output: count(usage.completion_tokens), estimatedCostUsd: null } };
  }
}
export class DeepSeekProvider extends ChatProvider {
  constructor(slot: "deepseekFlash" | "deepseekPro", config: ModelConfiguration, transport?: typeof fetch) { super(slot, config, transport); }
}
export class GLMProvider extends ChatProvider {
  constructor(config: ModelConfiguration, transport?: typeof fetch) { super("glmFlash", config, transport); }
}
export function createGrowthProviders(config: ModelConfiguration, transport?: typeof fetch): Record<ModelSlot, RoutedAgentProvider> {
  return { deepseekFlash: new DeepSeekProvider("deepseekFlash", config, transport), deepseekPro: new DeepSeekProvider("deepseekPro", config, transport), glmFlash: new GLMProvider(config, transport) };
}
