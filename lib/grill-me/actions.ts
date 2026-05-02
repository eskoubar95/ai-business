"use server";

import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import {
  buildGrillPrompt,
  type GrillBusinessType,
  type GrillWizardSeed,
} from "@/lib/grill-me/grill-prompt";
import {
  GRILL_ME_COMPLETE_MARKER,
} from "@/lib/grill-me/markers";
import {
  extractAndStoreSoulFile,
  upsertBusinessSoulMarkdown,
} from "@/lib/grill-me/soul-memory";
import { auth } from "@/lib/auth/server";
import { getDb } from "@/db/index";
import {
  businesses,
  grillMeSessions,
  userBusinesses,
} from "@/db/schema";
import { runCursorAgent } from "@/lib/cursor/agent";
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

  const bizRow = await db.query.businesses.findFirst({
    where: eq(businesses.id, businessId),
  });
  const wizardSeed: GrillWizardSeed | null = bizRow
    ? {
        businessName: bizRow.name,
        summary: bizRow.description?.trim() || undefined,
        publicRepoUrl: bizRow.githubRepoUrl?.trim() || undefined,
      }
    : null;

  const prompt = buildGrillPrompt(transcript, trimmed, businessType, wizardSeed);
  const stream = await runCursorAgent(prompt);
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
