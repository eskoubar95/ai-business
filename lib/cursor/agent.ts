import type { ModelSelection, SettingSource } from "@cursor/sdk";
import { Agent } from "@cursor/sdk";
import type { SDKAssistantMessage } from "@cursor/sdk";

import { GRILL_ME_COMPLETE_MARKER } from "@/lib/grill-me/markers";
import { minimalFallbackReasoningContext } from "@/lib/grill-me/grill-reasoning-types";

export type RunCursorAgentOptions = {
  /** When set (e.g. from encrypted `user_settings`), passed to SDK as `apiKey`; otherwise IDE/env session may apply. */
  apiKey?: string;
  /** Override Cursor model (local agents require explicit selection via SDK defaults). */
  model?: ModelSelection;
  /** Local-only: Cursor setting layers (.cursor/rules, synced skills); forwarded to Agent.create.local.settingSources */
  localSettingSources?: SettingSource[];
};

/** Default Runner; replaced in tests via `setRunCursorAgentImpl`. */
let runImpl = defaultRunCursorAgent;

/** Deterministic Grill-Me replies when `GRILL_ME_E2E_MOCK=1` (Playwright webServer). */
function userTurnCountFromGrillPrompt(prompt: string): number {
  let count = 0;
  for (const line of prompt.split("\n")) {
    if (line.startsWith("user: ")) count++;
  }
  return count;
}

function e2eMockReasoningJson(prompt: string): string {
  const nameRaw =
    prompt.match(/\*\*Business name\*\*:\s*([^\r\n]+)/)?.[1]?.trim() ??
    "E2E Business";
  const typeRaw = prompt.match(
    /\*\*Business type signal\*\*:\s*("(?:new|existing)"|(?:new|existing))/,
  )?.[1];
  const normalizedType =
    typeRaw?.replace(/^"(.*)"$/, "$1") === "new" ? "new" : "existing";
  const ctx = minimalFallbackReasoningContext(
    normalizedType,
    nameRaw,
    "(wizard description omitted in mock)",
  );
  return JSON.stringify(ctx);
}

async function grillMeE2eMock(prompt: string): Promise<AsyncIterable<string>> {
  async function* stream(): AsyncIterable<string> {
    if (prompt.includes("reasoning engine for a business onboarding system")) {
      yield e2eMockReasoningJson(prompt);
      return;
    }

    const n = userTurnCountFromGrillPrompt(prompt);
    const lastUser =
      prompt.match(/(?:^|\n)user: ([^\n]*)$/m)?.[1]?.trim() ?? "";
    if (n >= 3) {
      yield [
        `Understood after ${n} turns.`,
        "",
        GRILL_ME_COMPLETE_MARKER,
        "",
        "Here is your Soul Document — you can edit it directly in the next step.",
        "",
        "```markdown",
        `# E2E — Soul Document`,
        "",
        `- Last note: ${lastUser}`,
        "```",
        "",
      ].join("\n");
    } else {
      yield `Assistant reply ${n}: thanks for «${lastUser}».`;
    }
  }
  return stream();
}

async function defaultRunCursorAgent(
  prompt: string,
  options?: RunCursorAgentOptions,
): Promise<AsyncIterable<string>> {
  if (process.env.GRILL_ME_E2E_MOCK === "1") {
    return grillMeE2eMock(prompt);
  }
  const keyFromOpts = options?.apiKey?.trim();
  const keyFromEnv = process.env.CURSOR_API_KEY?.trim();
  const apiKey = keyFromOpts || keyFromEnv;
  const agent = await Agent.create({
    model: options?.model ?? { id: "composer-2" },
    local: {
      cwd: process.cwd(),
      ...(options?.localSettingSources !== undefined
        ? { settingSources: options.localSettingSources }
        : {}),
    },
    ...(apiKey ? { apiKey } : {}),
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
  options?: RunCursorAgentOptions,
): Promise<AsyncIterable<string>> {
  return runImpl(prompt, options);
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
