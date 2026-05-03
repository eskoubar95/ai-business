import { getDb } from "@/db/index";
import { memory } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

import { extractSoulMarkdownBody } from "@/lib/grill-me/soul-markdown-from-response";

export async function extractAndStoreSoulFile(
  businessId: string,
  rawResponse: string,
): Promise<void> {
  const trimmed = extractSoulMarkdownBody(rawResponse);
  if (!trimmed.length) return;

  const db = getDb();
  const existing = await db.query.memory.findFirst({
    where: and(
      eq(memory.businessId, businessId),
      eq(memory.scope, "business"),
      isNull(memory.agentId),
    ),
  });

  if (existing) {
    await db
      .update(memory)
      .set({
        content: trimmed,
        updatedAt: new Date(),
        version: existing.version + 1,
      })
      .where(eq(memory.id, existing.id));
  } else {
    await db.insert(memory).values({
      businessId,
      agentId: null,
      scope: "business",
      content: trimmed,
    });
  }
}

/** Replace business-scope soul markdown (wizard editor). Callers must enforce access. */
export async function upsertBusinessSoulMarkdown(
  businessId: string,
  markdown: string,
): Promise<void> {
  const trimmed = markdown.trim();
  if (!trimmed.length) return;

  const db = getDb();
  const existing = await db.query.memory.findFirst({
    where: and(
      eq(memory.businessId, businessId),
      eq(memory.scope, "business"),
      isNull(memory.agentId),
    ),
  });

  if (existing) {
    await db
      .update(memory)
      .set({
        content: trimmed,
        updatedAt: new Date(),
        version: existing.version + 1,
      })
      .where(eq(memory.id, existing.id));
  } else {
    await db.insert(memory).values({
      businessId,
      agentId: null,
      scope: "business",
      content: trimmed,
    });
  }
}
