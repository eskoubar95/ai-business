"use server";

import { assertUserOwnsAgent } from "@/lib/agents/actions";
import { getDb } from "@/db/index";
import { agentMcpAccess, mcpCredentials } from "@/db/schema";
import {
  decryptCredential as decryptCredentialCrypto,
  encryptCredential as encryptCredentialCrypto,
  type McpEncryptedPayload,
} from "@/lib/mcp/encryption";
import { and, asc, eq } from "drizzle-orm";

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

  await db.transaction(async (tx) => {
    const rows = await tx
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

    await tx
      .insert(agentMcpAccess)
      .values({
        agentId,
        mcpCredentialId: cred.id,
      })
      .onConflictDoNothing();
  });
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

/** Decrypt MCP payload for trusted server workflows only; never expose to client code. */
export async function getMcpCredentialDecrypted(id: string): Promise<Record<string, unknown>> {
  const db = getDb();
  const link = await db.query.agentMcpAccess.findFirst({
    where: eq(agentMcpAccess.mcpCredentialId, id),
    columns: { agentId: true },
  });
  if (!link) throw new Error("Credential not found");

  await assertUserOwnsAgent(link.agentId);

  const row = await db.query.mcpCredentials.findFirst({
    where: eq(mcpCredentials.id, id),
    columns: {
      iv: true,
      encryptedPayload: true,
    },
  });
  if (!row) throw new Error("Credential not found");

  const payload = row.encryptedPayload as McpEncryptedPayload;
  return decryptCredentialCrypto(row.iv, payload);
}
