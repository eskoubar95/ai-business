import { readFileSync, existsSync } from "node:fs";
import path from "node:path";

import type { GrillBusinessType } from "@/lib/grill-me/grill-prompt";
import type { GrillReasoningContext } from "@/lib/grill-me/grill-reasoning-types";

export type GrillChatTurnExtras = {
  skillAppendix?: string;
  autoStart?: boolean;
};

const CHAT_SYSTEM_REL = "lib/grill-me/grill-me-chat-system.md";
const SOUL_TEMPLATE_REL = "lib/grill-me/grill-me-soul-output-template.md";

function readRepoFile(rel: string): string {
  const abs = path.join(process.cwd(), rel);
  return existsSync(abs) ? readFileSync(abs, "utf8").trim() : "";
}

let memoSystem: string | undefined;
let memoSoul: string | undefined;

function bundledChatSystemDoc(): string {
  if (memoSystem === undefined) memoSystem = readRepoFile(CHAT_SYSTEM_REL);
  return memoSystem;
}

function bundledSoulTemplate(): string {
  if (memoSoul === undefined) memoSoul = readRepoFile(SOUL_TEMPLATE_REL);
  return memoSoul;
}

/**
 * Prompt 2 assembly: Conduro Grill-Me chat system instructions + reasoning JSON + transcript.
 */
export function buildGrillChatTurnPrompt(
  transcript: { role: "user" | "assistant"; content: string }[],
  latestUserMessage: string,
  _businessTypeParam: GrillBusinessType,
  reasoning: GrillReasoningContext,
  extras?: GrillChatTurnExtras | null,
): string {
  let system = bundledChatSystemDoc();
  const soulTpl = bundledSoulTemplate();

  if (!system) {
    system =
      "Configuration error: missing grill-me-chat-system.md. Escalate to platform operator.";
  }

  const hydrated = system
    .replace(
      "[CONTEXT OBJECT INJECTED HERE AT RUNTIME]",
      [
        "### Context object (JSON)",
        "",
        "```json",
        JSON.stringify(reasoning, null, 2),
        "```",
        "",
        "**Note:** Follow `businessType`, `knownFields`, `gaps`, `recommendedOpeningTone` from this JSON; it is authoritative for what is already known versus what to ask.",
      ].join("\n"),
    )
    .replace("<<<SOUL_MARKDOWN_TEMPLATE>>>", soulTpl || "(missing soul template file)");

  let out = `# Grill-Me — chat system (Prompt 2)\n\n${hydrated}`;

  const appendix = extras?.skillAppendix?.trim();
  if (appendix) {
    out += `\n\n---\n\n# Optional interviewer style notes (do not override Prompt 2 rules above)\n\n${appendix}\n`;
  }

  out += `\n\n---\n\n# Conversation transcript\n`;
  for (const line of transcript) {
    out += `${line.role}: ${line.content}\n`;
  }

  if (extras?.autoStart) {
    out += `\n[The user has just opened Grill-Me. No messages have been exchanged yet. Start the interview now with a warm, direct opening question — do not wait for the user to speak first.]\n`;
  } else {
    out += `user: ${latestUserMessage}\n`;
  }

  return out.trim();
}
