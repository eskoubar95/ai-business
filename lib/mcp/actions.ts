"use server";

import { assertUserOwnsAgent } from "@/lib/agents/actions";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { getDb } from "@/db/index";
import { agentMcpAccess, mcpCredentials } from "@/db/schema";
import { encryptCredential as encryptCredentialCrypto } from "@/lib/mcp/encryption";
import { requireSessionUserId } from "@/lib/roster/session";
import { and, asc, eq } from "drizzle-orm";

export async function saveMcpCredential(
  businessId: string,
  mcpName: string,
  payloadObject: Record<string, unknown>,
): Promise<{ id: string }> {
  const nm = mcpName.trim();
  if (!nm) throw new Error("MCP name is required");
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);

  const { ivBase64, encryptedPayload } = encryptCredentialCrypto(payloadObject);
  const db = getDb();

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
  return { id: cred.id };
}

export async function grantMcpAccessToAgent(
  agentId: string,
  mcpCredentialId: string,
): Promise<void> {
  const { businessId } = await assertUserOwnsAgent(agentId);
  const db = getDb();
  const cred = await db.query.mcpCredentials.findFirst({
    where: and(eq(mcpCredentials.id, mcpCredentialId), eq(mcpCredentials.businessId, businessId)),
    columns: { id: true },
  });
  if (!cred) throw new Error("Credential not found");

  await db
    .insert(agentMcpAccess)
    .values({
      businessId,
      agentId,
      mcpCredentialId: cred.id,
    })
    .onConflictDoNothing();
}

export async function revokeMcpAccessFromAgent(
  agentId: string,
  mcpCredentialId: string,
): Promise<void> {
  const { businessId } = await assertUserOwnsAgent(agentId);
  const db = getDb();
  await db
    .delete(agentMcpAccess)
    .where(
      and(
        eq(agentMcpAccess.agentId, agentId),
        eq(agentMcpAccess.mcpCredentialId, mcpCredentialId),
        eq(agentMcpAccess.businessId, businessId),
      ),
    );
}

export async function getMcpCredentialsByBusiness(businessId: string) {
  const userId = await requireSessionUserId();
  await assertUserBusinessAccess(userId, businessId);
  const db = getDb();
  return db
    .select({
      id: mcpCredentials.id,
      mcpName: mcpCredentials.mcpName,
      createdAt: mcpCredentials.createdAt,
    })
    .from(mcpCredentials)
    .where(eq(mcpCredentials.businessId, businessId))
    .orderBy(asc(mcpCredentials.mcpName));
}

export async function getMcpCredentialsForAgent(agentId: string) {
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
  const userId = await requireSessionUserId();
  const db = getDb();
  const row = await db.query.mcpCredentials.findFirst({
    where: eq(mcpCredentials.id, id),
    columns: { businessId: true },
  });
  if (!row) throw new Error("Credential not found");
  await assertUserBusinessAccess(userId, row.businessId);

  await db.delete(mcpCredentials).where(eq(mcpCredentials.id, id));
}
