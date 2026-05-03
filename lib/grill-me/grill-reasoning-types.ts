/** Parsed output from Prompt 1 (reasoning engine, JSON-only). */

export type GrillGapPriority = "critical" | "high" | "medium" | "low";

export type GrillReasoningOpeningTone = "curious" | "direct" | "warm";

export type GrillReasoningGap = {
  id: string;
  field: string;
  priority: GrillGapPriority;
  question: string;
  followUpIf: string | null;
  skipIf: string | null;
};

export type GrillKnownFields = {
  vision: string | null;
  mission: string | null;
  values: string[] | null;
  whatWeAreNot: string[] | null;
  coreProblem: string | null;
  targetCustomer: string | null;
  productOverview: string | null;
  revenueModel: string | null;
  techStack: string | null;
  githubRepo: string | null;
  teamContext: string | null;
  keyConstraints: string | null;
  currentTraction: string | null;
  historyAndLearnings: string | null;
};

export type GrillReasoningContext = {
  businessType: "new" | "existing";
  businessName: string;
  contextSummary: string;
  knownFields: GrillKnownFields;
  gaps: GrillReasoningGap[];
  recommendedOpeningTone: GrillReasoningOpeningTone;
  estimatedQuestionCount: number;
  githubInsights: string | null;
};

export const EMPTY_KNOWN_FIELDS: GrillKnownFields = {
  vision: null,
  mission: null,
  values: null,
  whatWeAreNot: null,
  coreProblem: null,
  targetCustomer: null,
  productOverview: null,
  revenueModel: null,
  techStack: null,
  githubRepo: null,
  teamContext: null,
  keyConstraints: null,
  currentTraction: null,
  historyAndLearnings: null,
};

function isGapPriority(v: unknown): v is GrillGapPriority {
  return v === "critical" || v === "high" || v === "medium" || v === "low";
}

function isOpeningTone(v: unknown): v is GrillReasoningOpeningTone {
  return v === "curious" || v === "direct" || v === "warm";
}

function normalizeGap(raw: Record<string, unknown>): GrillReasoningGap | null {
  const id = typeof raw.id === "string" ? raw.id.trim() : "";
  const field = typeof raw.field === "string" ? raw.field.trim() : "";
  const question = typeof raw.question === "string" ? raw.question.trim() : "";
  if (!id || !field || !question) return null;
  if (!isGapPriority(raw.priority)) return null;
  return {
    id,
    field,
    priority: raw.priority,
    question,
    followUpIf: typeof raw.followUpIf === "string" ? raw.followUpIf : raw.followUpIf == null ? null : String(raw.followUpIf),
    skipIf: typeof raw.skipIf === "string" ? raw.skipIf : raw.skipIf == null ? null : String(raw.skipIf),
  };
}

function stringOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : null;
  }
  return null;
}

function stringArrayOrNull(v: unknown): string[] | null {
  if (v === null || v === undefined) return null;
  if (Array.isArray(v) && v.every((x) => typeof x === "string"))
    return (v as string[]).map((s) => s.trim()).filter(Boolean);
  return null;
}

function normalizeKnown(raw: Record<string, unknown>): GrillKnownFields {
  return {
    vision: stringOrNull(raw.vision),
    mission: stringOrNull(raw.mission),
    values: stringArrayOrNull(raw.values),
    whatWeAreNot: stringArrayOrNull(raw.whatWeAreNot),
    coreProblem: stringOrNull(raw.coreProblem),
    targetCustomer: stringOrNull(raw.targetCustomer),
    productOverview: stringOrNull(raw.productOverview),
    revenueModel: stringOrNull(raw.revenueModel),
    techStack: stringOrNull(raw.techStack),
    githubRepo: stringOrNull(raw.githubRepo),
    teamContext: stringOrNull(raw.teamContext),
    keyConstraints: stringOrNull(raw.keyConstraints),
    currentTraction: stringOrNull(raw.currentTraction),
    historyAndLearnings: stringOrNull(raw.historyAndLearnings),
  };
}

export function coerceGrillReasoningContext(parsed: Record<string, unknown>): GrillReasoningContext | null {
  const bt = parsed.businessType;
  if (bt !== "new" && bt !== "existing") return null;
  const businessName =
    typeof parsed.businessName === "string" ? parsed.businessName.trim() : "";
  const contextSummary =
    typeof parsed.contextSummary === "string" ? parsed.contextSummary.trim() : "";
  if (!businessName || !contextSummary) return null;

  const kfRaw = parsed.knownFields && typeof parsed.knownFields === "object" ? (parsed.knownFields as Record<string, unknown>) : {};
  const knownFields = normalizeKnown(kfRaw);

  const gapsRaw = parsed.gaps;
  const gaps: GrillReasoningGap[] = [];
  if (Array.isArray(gapsRaw)) {
    for (const item of gapsRaw) {
      if (typeof item !== "object" || item === null) continue;
      const g = normalizeGap(item as Record<string, unknown>);
      if (g) gaps.push(g);
    }
  }

  let recommendedOpeningTone: GrillReasoningOpeningTone = "curious";
  if (isOpeningTone(parsed.recommendedOpeningTone)) {
    recommendedOpeningTone = parsed.recommendedOpeningTone;
  }

  let estimatedQuestionCount = 12;
  if (typeof parsed.estimatedQuestionCount === "number" && Number.isFinite(parsed.estimatedQuestionCount)) {
    estimatedQuestionCount = Math.max(6, Math.min(15, Math.round(parsed.estimatedQuestionCount)));
  }

  let githubInsights: string | null = null;
  if (typeof parsed.githubInsights === "string" && parsed.githubInsights.trim())
    githubInsights = parsed.githubInsights.trim();

  return {
    businessType: bt,
    businessName,
    contextSummary,
    knownFields,
    gaps,
    recommendedOpeningTone,
    estimatedQuestionCount,
    githubInsights,
  };
}

export function minimalFallbackReasoningContext(
  businessType: "new" | "existing",
  businessName: string,
  description?: string | null,
): GrillReasoningContext {
  const desc = description?.trim() ?? "";
  return {
    businessType,
    businessName,
    contextSummary:
      desc.length > 0
        ? `You are building ${businessName}. Here's what we've captured so far: ${desc}`
        : `You are shaping ${businessName}. We don't have much detail yet — we'll discover it together.`,
    knownFields: { ...EMPTY_KNOWN_FIELDS, githubRepo: null },
    gaps: fallbackGapsCritical(),
    recommendedOpeningTone: "warm",
    estimatedQuestionCount: 10,
    githubInsights: null,
  };
}

function fallbackGapsCritical(): GrillReasoningGap[] {
  return [
    {
      id: "1.4",
      field: "What We Are Not",
      priority: "critical",
      question: "What are you explicitly choosing not to be or not to optimize for?",
      followUpIf: "Answer stays abstract — ask for concrete examples of initiatives you’d reject.",
      skipIf: null,
    },
    {
      id: "2.1",
      field: "Core Problem",
      priority: "critical",
      question: "What's the painful problem your customer would describe in their own words?",
      followUpIf: null,
      skipIf: null,
    },
    {
      id: "3.1",
      field: "Primary Customer",
      priority: "critical",
      question: "Who is the single most specific customer you’re optimizing for right now?",
      followUpIf: null,
      skipIf: null,
    },
    {
      id: "10.2",
      field: "Agent Escalation Rules",
      priority: "critical",
      question: "When must an AI agent stop and wait for human approval?",
      followUpIf: null,
      skipIf: null,
    },
    {
      id: "10.3",
      field: "Agent Permissions",
      priority: "critical",
      question: "What domains or systems must an agent never touch without explicit approval?",
      followUpIf: null,
      skipIf: null,
    },
  ];
}
