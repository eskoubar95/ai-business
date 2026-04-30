import { Agent } from "@cursor/sdk";
import type { SDKAssistantMessage } from "@cursor/sdk";

/** Default Runner; replaced in tests via `setRunCursorAgentImpl`. */
let runImpl = defaultRunCursorAgent;

async function defaultRunCursorAgent(
  prompt: string,
): Promise<AsyncIterable<string>> {
  const agent = await Agent.create({
    model: { id: "composer-2" },
    local: { cwd: process.cwd() },
  });
  const run = await agent.send(prompt);
  async function* stream(): AsyncIterable<string> {
    try {
      for await (const msg of run.stream()) {
        if (
          typeof msg !== "object" ||
          msg === null ||
          (msg as { type?: unknown }).type !== "assistant"
        )
          continue;
        const assistant = msg as SDKAssistantMessage;
        const parts = assistant.message?.content;
        if (!Array.isArray(parts)) continue;
        for (const block of parts) {
          if (
            typeof block === "object" &&
            block !== null &&
            "type" in block &&
            block.type === "text" &&
            "text" in block &&
            typeof (block as { text: unknown }).text === "string"
          ) {
            yield (block as { text: string }).text;
          }
        }
      }
    } finally {
      agent.close();
    }
  }
  return stream();
}

/**
 * Executes one Cursor CLI agent prompt and exposes assistant text deltas as an async iterable of strings.
 */
export async function runCursorAgent(
  prompt: string,
): Promise<AsyncIterable<string>> {
  return runImpl(prompt);
}

/** Test-only substitute for Cursor SDK streaming (Vitest). */
export async function mockCursorAgent(prompt: string): Promise<AsyncIterable<string>> {
  async function* once(): AsyncIterable<string> {
    yield "mock-response for: " + prompt.slice(0, 40);
  }
  return once();
}

export function setRunCursorAgentImpl(
  impl: typeof runCursorAgent | null,
): void {
  runImpl = impl ?? defaultRunCursorAgent;
}

export function resetRunCursorAgentImpl(): void {
  runImpl = defaultRunCursorAgent;
}
