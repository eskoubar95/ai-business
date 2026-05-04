import type { GrillBusinessType } from "@/lib/grill-me/grill-prompt";

/** Prompt 1 verbatim spec (JSON-only reasoning step). */
export function buildReasoningEngineUserPrompt(input: {
  businessName: string;
  businessDescription: string;
  businessType: GrillBusinessType;
  githubRepoUrl: string | null;
  githubAnalysisText: string;
}): string {
  const bd = input.businessDescription.trim() || "(none provided)";
  const gh = input.githubRepoUrl?.trim() ? input.githubRepoUrl.trim() : "(none provided)";
  const analysis = input.githubAnalysisText.trim()
    ? input.githubAnalysisText.trim()
    : "(no repository analysis available)";

  return `You are the reasoning engine for a business onboarding system. Your job
is to analyze everything the user has provided and produce a structured
context object that will guide the subsequent interview.

## What you receive

You will receive one or more of the following:
- Business name
- Business description (free text — could be a single sentence, a paste
  of vision/mission/values, a product brief, or anything in between)
- GitHub repository analysis (README, package.json, folder structure,
  key files — pre-extracted before this prompt runs)
- Business type signal: "new" (no existing product) or "existing"
  (product is live or in active development)

## Provided values

- **Business name**: ${input.businessName}
- **Business type signal**: ${JSON.stringify(input.businessType)}
- **GitHub URL (if any)**: ${gh}
- **Description**:
${bd.split("\n").map((l) => `  ${l}`).join("\n")}

## GitHub / repository analysis (may be partial)

${analysis}

## What you must produce

Produce a single JSON object. Do not explain it. Do not add prose.
Output only valid JSON.

The JSON schema:

\`\`\`json
{
  "businessType": "new" | "existing",
  "businessName": "string",
  "contextSummary": "2–3 sentences summarizing what you understand about this business so far. Written in second person ('You are building...'). This will be shown to the user at the start of the chat.",
  "knownFields": {
    "vision": "string or null",
    "mission": "string or null",
    "values": ["string"] or null,
    "whatWeAreNot": ["string"] or null,
    "coreProblem": "string or null",
    "targetCustomer": "string or null",
    "productOverview": "string or null",
    "revenueModel": "string or null",
    "techStack": "string or null",
    "githubRepo": "string or null",
    "teamContext": "string or null",
    "keyConstraints": "string or null",
    "currentTraction": "string or null",
    "historyAndLearnings": "string or null"
  },
  "gaps": [
    {
      "id": "string (matches Soul Document section, e.g. '2.1')",
      "field": "string (human-readable name, e.g. 'Core Problem')",
      "priority": "critical" | "high" | "medium" | "low",
      "question": "string — phrased the way you would ask a founder face-to-face. Short, plain words. No jargon. Example: 'How do you charge for this?' not 'What is your revenue model?'. Example: 'Who has to say yes before something goes live?' not 'Who is the concrete escalation owner?'.",
      "followUpIf": "string or null (condition under which a follow-up question makes sense)",
      "skipIf": "string or null (condition under which this can be skipped)"
    }
  ],
  "recommendedOpeningTone": "curious" | "direct" | "warm",
  "estimatedQuestionCount": number,
  "githubInsights": "string or null (anything useful extracted from the repo that should inform the interview)"
}
\`\`\`

## Priority rules for gaps

Assign priority as follows:

**Critical** — without this, agents cannot operate safely:
- Core problem (2.1)
- Target customer (3.1)
- What we are NOT (1.4)
- Agent escalation rules (10.2)
- Agent permissions (10.3)

**High** — significantly affects product decisions:
- Vision and mission (1.1, 1.2) if not provided
- Revenue model (5.1)
- Primary success metric (4.5)
- Core product description (4.1) if not clear from GitHub
- GTM motion (6.1)
- Architecture principles (7.2) if GitHub provided
- Key technical constraints (7.3)

**Medium** — important but can be refined later:
- Customer journey (3.2)
- Product roadmap (4.4)
- Team structure (8.1)
- Decision framework (8.2)

**Low** — useful context, not blocking:
- Partnerships (6.3)
- Hiring plan (8.4)
- Communication process (8.3)

## Rules

- If a field is partially answered (e.g. vision is implied but not stated),
  mark it as known with the inferred value. Do not ask for things you can
  reasonably infer.
- If GitHub was provided, extract tech stack, architecture clues, and any
  README content as known fields.
- Always include escalation rules (10.2) and permissions (10.3) in gaps
  unless they were explicitly provided — these are always critical.
- For "existing" businesses: add history/learnings questions as high priority.
- For "new" businesses: mark unit economics fields as low priority (they
  are projections, not facts).
- Order gaps array by priority: critical first, then high, medium, low.
  Within same priority, order by logical interview flow (identity → problem
  → customer → product → business model → tech → team → agent rules).
- estimatedQuestionCount should reflect gaps with priority critical + high only.
  Usually between 8 and 14. Never more than 15.`;
}
