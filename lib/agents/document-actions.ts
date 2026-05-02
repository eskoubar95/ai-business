"use server";

import { getDb } from "@/db/index";
import { agentDocuments } from "@/db/schema";
import { and, eq } from "drizzle-orm";

import { assertUserOwnsAgent } from "./actions";
import {
  DEFAULT_DOC_FILENAME,
  DEFAULT_DOC_SLUG,
  slugify,
  toFilename,
  type AgentDocumentRow,
} from "./document-model";

/**
 * Returns all documents for the agent.
 * Always includes the default agent.md row (empty if not yet saved).
 */
export async function getAgentDocuments(agentId: string): Promise<AgentDocumentRow[]> {
  await assertUserOwnsAgent(agentId);
  const db = getDb();
  const rows = await db.query.agentDocuments.findMany({
    where: eq(agentDocuments.agentId, agentId),
    columns: { slug: true, content: true, filename: true },
  });

  // Ensure agent.md is always present
  const hasDefault = rows.some((r) => r.slug === DEFAULT_DOC_SLUG);
  if (!hasDefault) {
    rows.unshift({ slug: DEFAULT_DOC_SLUG, content: "", filename: DEFAULT_DOC_FILENAME });
  }

  return rows;
}

/**
 * Upserts a document. Slug and filename are derived from the user-supplied name.
 */
export async function updateAgentDocument(
  agentId: string,
  slug: string,
  content: string,
): Promise<{ success: true }> {
  if (!slug || slug.trim().length === 0) throw new Error("Slug is required");
  await assertUserOwnsAgent(agentId);

  const db = getDb();
  const now = new Date();
  const existing = await db.query.agentDocuments.findFirst({
    where: and(eq(agentDocuments.agentId, agentId), eq(agentDocuments.slug, slug)),
    columns: { id: true, filename: true },
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
      filename: toFilename(slug),
      content,
      updatedAt: now,
    });
  }

  return { success: true };
}

/**
 * Creates a new empty document with a user-supplied filename.
 * Returns the derived slug so the UI can select it.
 */
export async function createAgentDocument(
  agentId: string,
  rawName: string,
): Promise<{ slug: string; filename: string }> {
  await assertUserOwnsAgent(agentId);

  const filename = toFilename(rawName);
  const slug = slugify(rawName);

  const db = getDb();
  const existing = await db.query.agentDocuments.findFirst({
    where: and(eq(agentDocuments.agentId, agentId), eq(agentDocuments.slug, slug)),
    columns: { id: true },
  });

  if (!existing) {
    await db.insert(agentDocuments).values({
      agentId,
      slug,
      filename,
      content: "",
      updatedAt: new Date(),
    });
  }

  return { slug, filename };
}

/**
 * Deletes a non-default document.
 */
export async function deleteAgentDocument(
  agentId: string,
  slug: string,
): Promise<{ success: true }> {
  if (slug === DEFAULT_DOC_SLUG) throw new Error("Cannot delete the default agent.md file");
  await assertUserOwnsAgent(agentId);
  const db = getDb();
  await db
    .delete(agentDocuments)
    .where(and(eq(agentDocuments.agentId, agentId), eq(agentDocuments.slug, slug)));
  return { success: true };
}
