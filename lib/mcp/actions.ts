"use server";

import { assertUserOwnsAgent } from "@/lib/agents/actions";
import { getDb } from "@/db/index";
import { agentMcpAccess, mcpCredentials } from "@/db/schema";
import { encryptCredential as encryptCredentialCrypto } from "@/lib/mcp/encryption";
import { asc, eq } from "drizzle-orm";

export async function saveMcpCredential(
  agentId: string,
  mcpName: string,
  payloadObject: Record<string, unknown>,
): Promise<void> {
  const nm = mcpName.trim();
  if (!nm) throw new Error("MCP name is required");
  const { businessId } = await assertUserOwnsAgent(agentId);

  const { ivBase64, encryptedPayload } = encryptCredentialCrypto(payloadObject);
  const db = getDb();

  // Neon HTTP driver does not support db.transaction(); run steps sequentially.
  const rows = await db
    .insert(mcpCredentials)
    .values({
      businessId,
      mcpName: nm,
      encryptedPayload,
      iv: ivBase64,
    })
    .onConflictDoUpdate({
      target: [mcpCredentials.businessId, mcpCredentials.mcpName],
      set: {
        encryptedPayload,
        iv: ivBase64,
        updatedAt: new Date(),
      },
    })
    .returning({ id: mcpCredentials.id });

  const cred = rows[0];
  if (!cred) throw new Error("Failed to save MCP credential");

  await db
    .insert(agentMcpAccess)
    .values({
      businessId,
      agentId,
      mcpCredentialId: cred.id,
    })
    .onConflictDoNothing();
}

export async function getMcpCredentialsMeta(agentId: string) {
  await assertUserOwnsAgent(agentId);
  const db = getDb();
  return db
    .select({
      id: mcpCredentials.id,
      mcpName: mcpCredentials.mcpName,
      createdAt: mcpCredentials.createdAt,
    })
    .from(agentMcpAccess)
    .innerJoin(mcpCredentials, eq(agentMcpAccess.mcpCredentialId, mcpCredentials.id))
    .where(eq(agentMcpAccess.agentId, agentId))
    .orderBy(asc(mcpCredentials.mcpName));
}

export async function deleteMcpCredential(id: string): Promise<void> {
  const db = getDb();
  const link = await db.query.agentMcpAccess.findFirst({
    where: eq(agentMcpAccess.mcpCredentialId, id),
    columns: { agentId: true },
  });
  if (!link) throw new Error("Credential not found");
  await assertUserOwnsAgent(link.agentId);

  await db.delete(mcpCredentials).where(eq(mcpCredentials.id, id));
}
