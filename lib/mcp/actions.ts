"use server";

import { assertUserOwnsAgent } from "@/lib/agents/actions";
import { getDb } from "@/db/index";
import { mcpCredentials } from "@/db/schema";
import {
  decryptCredential as decryptCredentialCrypto,
  encryptCredential as encryptCredentialCrypto,
  type McpEncryptedPayload,
} from "@/lib/mcp/encryption";
import { asc, eq } from "drizzle-orm";

export async function saveMcpCredential(
  agentId: string,
  mcpName: string,
  payloadObject: Record<string, unknown>,
): Promise<void> {
  const nm = mcpName.trim();
  if (!nm) throw new Error("MCP name is required");
  await assertUserOwnsAgent(agentId);

  const { ivBase64, encryptedPayload } = encryptCredentialCrypto(payloadObject);
  const db = getDb();

  await db
    .insert(mcpCredentials)
    .values({
      agentId,
      mcpName: nm,
      encryptedPayload,
      iv: ivBase64,
    })
    .onConflictDoUpdate({
      target: [mcpCredentials.agentId, mcpCredentials.mcpName],
      set: {
        encryptedPayload,
        iv: ivBase64,
        updatedAt: new Date(),
      },
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
    .from(mcpCredentials)
    .where(eq(mcpCredentials.agentId, agentId))
    .orderBy(asc(mcpCredentials.mcpName));
}

export async function deleteMcpCredential(id: string): Promise<void> {
  const db = getDb();
  const row = await db.query.mcpCredentials.findFirst({
    where: eq(mcpCredentials.id, id),
    columns: { agentId: true },
  });
  if (!row) throw new Error("Credential not found");
  await assertUserOwnsAgent(row.agentId);

  await db.delete(mcpCredentials).where(eq(mcpCredentials.id, id));
}

/** Decrypt MCP payload for trusted server workflows only; never expose to client code. */
export async function getMcpCredentialDecrypted(id: string): Promise<Record<string, unknown>> {
  const db = getDb();
  const row = await db.query.mcpCredentials.findFirst({
    where: eq(mcpCredentials.id, id),
    columns: {
      iv: true,
      encryptedPayload: true,
      agentId: true,
    },
  });
  if (!row) throw new Error("Credential not found");

  await assertUserOwnsAgent(row.agentId);

  const payload = row.encryptedPayload as McpEncryptedPayload;
  return decryptCredentialCrypto(row.iv, payload);
}
