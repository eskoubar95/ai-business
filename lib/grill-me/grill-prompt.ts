import { GRILL_ME_COMPLETE_MARKER } from "@/lib/grill-me/markers";

export type GrillBusinessType = "existing" | "new";

/** Expected soul markdown section headings (both onboarding paths). */
export const GRILL_SOUL_SECTION_HEADINGS = [
  "# What We Build",
  "# Our Current Goals",
  "# Working Method & Values",
  "# Technical Context",
  "# What We DON'T Do",
  "# Open Questions",
] as const;

function pathInstructions(businessType: GrillBusinessType): string {
  if (businessType === "existing") {
    return `
## Onboarding path: Existing business

Guide the founder through **how the business runs today**:

- Current **stack** (languages, frameworks, hosting, datastores, CI).
- Day-to-day **workflows** (how work flows from idea → shipped code).
- **Bottlenecks**, manual steps, and what hurts most.
- What they want to **automate or improve first** with AI agents.

Keep questions concrete; prefer short follow-ups over long lectures.
`.trim();
  }

  return `
## Onboarding path: New project

Guide the founder through **what they are bringing into existence**:

- **What to build** (product/service, core loop, success in 90 days).
- **Target audience** and main use cases.
- **Tech choices** they want or want to avoid (and constraints: budget, team, timeline).
- **MVP scope** — what ships first vs later.

Keep questions concrete; prefer short follow-ups over long lectures.
`.trim();
}

export function buildGrillPrompt(
  transcript: { role: "user" | "assistant"; content: string }[],
  latestUserMessage: string,
  businessType: GrillBusinessType,
): string {
  let t = `# Grill-Me onboarding\n`;
  t += `You are helping a human produce a structured **business soul** markdown file.\n\n`;
  t += pathInstructions(businessType);
  t += `\n\n## Output format\n`;
  t += `When onboarding is complete and the markdown artefact is ready, output **exactly one** line:\n`;
  t += `${GRILL_ME_COMPLETE_MARKER}\n`;
  t += `Then output the **full** soul document as markdown.\n\n`;
  t += `The soul document **must** use these top-level sections (use the exact headings):\n`;
  for (const h of GRILL_SOUL_SECTION_HEADINGS) {
    t += `- ${h}\n`;
  }
  t += `\nUnder each heading, write concise bullets or short paragraphs (not empty placeholders).\n\n`;
  t += `## Conversation so far\n`;
  for (const line of transcript) {
    t += `${line.role}: ${line.content}\n`;
  }
  t += `user: ${latestUserMessage}\n`;
  return t;
}
