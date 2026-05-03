"use server";

import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { buildGrillChatTurnPrompt } from "@/lib/grill-me/grill-chat-turn-prompt";
import { mergeGrillMeCursorAgentOptions } from "@/lib/grill-me/grill-cursor-runtime";
import {
  coerceGrillReasoningContext,
  minimalFallbackReasoningContext,
  type GrillReasoningContext,
} from "@/lib/grill-me/grill-reasoning-types";
import { GRILL_ME_COMPLETE_MARKER } from "@/lib/grill-me/markers";
import { loadGrillSkillAppendix } from "@/lib/grill-me/load-grill-skill-appendix";
import { runGrillReasoningPhase } from "@/lib/grill-me/reasoning-actions";
import {
  loadGrillMeSessionsForBusiness,
  type GrillMeMessage,
} from "@/lib/grill-me/session-queries";
import {
  extractAndStoreSoulFile,
  upsertBusinessSoulMarkdown,
} from "@/lib/grill-me/soul-memory";
import type { GrillBusinessType } from "@/lib/grill-me/grill-prompt";

import { auth } from "@/lib/auth/server";
import { getDb } from "@/db/index";
import {
  businesses,
  grillMeSessions,
  memory,
  userBusinesses,
} from "@/db/schema";
import { runCursorAgent } from "@/lib/cursor/agent";
import { getUserCursorApiKeyDecrypted } from "@/lib/settings/cursor-api-key";
import { desc, eq, max, sql } from "drizzle-orm";

function normalizeOptionalText(v: string | undefined): string | null {
  const t = v?.trim() ?? "";
  return t.length ? t : null;
}

async function collectStream(iterable: AsyncIterable<string>): Promise<string> {
  let out = "";
  for await (const chunk of iterable) out += chunk;
  return out;
}

function reasoningForTurn(
  businessType: GrillBusinessType,
  name: string,
  summary: string | null | undefined,
  rawStored: unknown,
): GrillReasoningContext {
  if (rawStored && typeof rawStored === "object") {
    const coerced = coerceGrillReasoningContext(rawStored as Record<string, unknown>);
    if (coerced) return coerced;
  }
  return minimalFallbackReasoningContext(businessType, name, summary);
}

export async function createBusiness(name: string): Promise<{ id: string }> {
  return createBusinessWithDetails({ name });
}

export async function createBusinessWithDetails(data: {
  name: string;
  description?: string;
  githubRepoUrl?: string;
}): Promise<{ id: string }> {
  const trimmedName = data.name.trim();
  if (!trimmedName) {
    throw new Error("Business name must not be empty");
  }

  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") {
    throw new Error("Unauthorized");
  }

  const db = getDb();
  const [biz] = await db
    .insert(businesses)
    .values({
      name: trimmedName,
      description: normalizeOptionalText(data.description),
      githubRepoUrl: normalizeOptionalText(data.githubRepoUrl),
    })
    .returning({ id: businesses.id });

  if (!biz) throw new Error("Failed to create business");

  await db.insert(userBusinesses).values({
    userId,
    businessId: biz.id,
  });

  return { id: biz.id };
}

/**
 * Removes a business created during onboarding when setup failed before the Grill chat starts.
 * Only runs when there are no Grill-Me turns and no memory rows — avoids wiping active tenants.
 */
export async function deleteOnboardingDraftBusiness(
  businessId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    await assertUserBusinessAccess(userId, businessId);
  } catch {
    return { ok: false, error: "Forbidden" };
  }

  const db = getDb();
  const existingTurn = await db.query.grillMeSessions.findFirst({
    where: eq(grillMeSessions.businessId, businessId),
    columns: { id: true },
  });
  if (existingTurn) {
    return {
      ok: false,
      error:
        "Cannot remove draft: Grill-Me messages already exist for this business.",
    };
  }

  const existingMemory = await db.query.memory.findFirst({
    where: eq(memory.businessId, businessId),
    columns: { id: true },
  });
  if (existingMemory) {
    return {
      ok: false,
      error:
        "Cannot remove draft: this business already has memory rows stored.",
    };
  }

  await db.delete(businesses).where(eq(businesses.id, businessId));
  return { ok: true };
}

/** Hydrate editor interview panel — ordered Grill-Me DB turns. */
export async function getGrillInterviewTranscript(
  businessId: string,
): Promise<
  { ok: true; turns: GrillMeMessage[] } | { ok: false; error: string }
> {
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") {
    return { ok: false, error: "Unauthorized" };
  }
  try {
    await assertUserBusinessAccess(userId, businessId);
  } catch {
    return { ok: false, error: "Forbidden" };
  }
  const turns = await loadGrillMeSessionsForBusiness(businessId);
  return { ok: true, turns };
}

/** Persist soul markdown after the landing onboarding editor step. */
export async function saveBusinessSoulFromOnboarding(
  businessId: string,
  markdown: string,
): Promise<{ success: true }> {
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") {
    throw new Error("Unauthorized");
  }

  await assertUserBusinessAccess(userId, businessId);
  await upsertBusinessSoulMarkdown(businessId, markdown);
  return { success: true };
}

export async function startGrillMeTurn(
  businessId: string,
  userMessage: string,
  businessType: GrillBusinessType = "existing",
): Promise<{ assistantReply: string; soulStored: boolean }> {
  const trimmed = userMessage.trim();
  if (!trimmed) throw new Error("Message must not be empty");

  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") {
    throw new Error("Unauthorized");
  }

  const db = getDb();
  await assertUserBusinessAccess(userId, businessId);

  let bizRow = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
  });
  if (!bizRow) throw new Error("Business not found");

  if (bizRow.grillReasoningContext == null) {
    await runGrillReasoningPhase(businessId, businessType);
    bizRow =
      (await db.query.businesses.findFirst({
        where: eq(businesses.id, businessId),
      })) ?? bizRow;
  }

  const reasoning = reasoningForTurn(
    businessType,
    bizRow.name,
    bizRow.description,
    bizRow.grillReasoningContext,
  );

  const [{ nextSeq }] = await db
    .select({ nextSeq: sql<number>`coalesce(${max(grillMeSessions.seq)}, 0)` })
    .from(grillMeSessions)
    .where(eq(grillMeSessions.businessId, businessId));

  const userSeq = Number(nextSeq) + 1;
  await db.insert(grillMeSessions).values({
    businessId,
    role: "user",
    content: trimmed,
    seq: userSeq,
  });

  const historyRows = await db
    .select()
    .from(grillMeSessions)
    .where(eq(grillMeSessions.businessId, businessId))
    .orderBy(desc(grillMeSessions.seq));

  const chronological = [...historyRows].reverse();
  const prior = chronological.slice(0, -1);
  const transcript = prior.map((row) =>
    row.role === "user"
      ? { role: "user" as const, content: row.content }
      : { role: "assistant" as const, content: row.content },
  );

  const prompt = buildGrillChatTurnPrompt(
    transcript,
    trimmed,
    businessType,
    reasoning,
    {
      skillAppendix: await loadGrillSkillAppendix(),
    },
  );
  const cursorApiKey = await getUserCursorApiKeyDecrypted();
  const stream = await runCursorAgent(prompt, mergeGrillMeCursorAgentOptions(cursorApiKey));
  const assistantText = await collectStream(stream);

  const assistantSeq = userSeq + 1;
  await db.insert(grillMeSessions).values({
    businessId,
    role: "assistant",
    content: assistantText,
    seq: assistantSeq,
  });

  let soulStored = false;
  if (assistantText.includes(GRILL_ME_COMPLETE_MARKER)) {
    await extractAndStoreSoulFile(businessId, assistantText);
    soulStored = true;
  }

  return { assistantReply: assistantText, soulStored };
}
