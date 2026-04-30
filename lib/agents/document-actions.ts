"use server";

import { getDb } from "@/db/index";
import { agentDocuments } from "@/db/schema";
import { and, eq } from "drizzle-orm";

import { assertUserOwnsAgent } from "./actions";
import {
  AGENT_DOC_SLUGS,
  type AgentDocSlug,
  type AgentDocumentRow,
} from "./document-model";

function assertValidSlug(slug: string): asserts slug is AgentDocSlug {
  if (!AGENT_DOC_SLUGS.includes(slug as AgentDocSlug)) {
    throw new Error("Invalid document slug");
  }
}

/**
 * Returns soul, tools, and heartbeat documents for the agent (empty defaults if a row is missing).
 */
export async function getAgentDocuments(agentId: string): Promise<AgentDocumentRow[]> {
  await assertUserOwnsAgent(agentId);
  const db = getDb();
  const rows = await db.query.agentDocuments.findMany({
    where: eq(agentDocuments.agentId, agentId),
    columns: { slug: true, content: true, filename: true },
  });
  const bySlug = new Map(rows.map((r) => [r.slug, r]));
  return AGENT_DOC_SLUGS.map((slug) => {
    const r = bySlug.get(slug);
    return (
      r ?? {
        slug,
        content: "",
        filename: `${slug}.md`,
      }
    );
  });
}

/**
 * Upserts markdown for one agent document by slug.
 */
export async function updateAgentDocument(
  agentId: string,
  slug: string,
  content: string,
): Promise<{ success: true }> {
  assertValidSlug(slug);
  await assertUserOwnsAgent(agentId);
  const db = getDb();
  const now = new Date();
  const existing = await db.query.agentDocuments.findFirst({
    where: and(eq(agentDocuments.agentId, agentId), eq(agentDocuments.slug, slug)),
    columns: { id: true },
  });

  if (existing) {
    await db
      .update(agentDocuments)
      .set({ content, updatedAt: now })
      .where(eq(agentDocuments.id, existing.id));
  } else {
    await db.insert(agentDocuments).values({
      agentId,
      slug,
      filename: `${slug}.md`,
      content,
      updatedAt: now,
    });
  }

  return { success: true };
}
