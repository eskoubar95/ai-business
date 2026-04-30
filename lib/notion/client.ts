import { auth } from "@/lib/auth/server";
import { getDb } from "@/db/index";
import { agents, mcpCredentials } from "@/db/schema";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import {
  decryptCredential,
  type McpEncryptedPayload,
} from "@/lib/mcp/encryption";
import { Client } from "@notionhq/client";
import { and, eq } from "drizzle-orm";

export type NotionCredentialContext = {
  client: Client;
  /** Optional tasks database to sync; set on MCP payload as `tasksDatabaseId`. */
  tasksDatabaseId?: string;
};

/** Decrypts the first Notion MCP credential for any agent in the business (authorized user only). */
export async function resolveNotionForBusiness(
  businessId: string,
): Promise<NotionCredentialContext> {
  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") {
    throw new Error("Unauthorized");
  }
  await assertUserBusinessAccess(userId, businessId);

  const db = getDb();
  const rows = await db
    .select({
      iv: mcpCredentials.iv,
      encryptedPayload: mcpCredentials.encryptedPayload,
    })
    .from(mcpCredentials)
    .innerJoin(agents, eq(mcpCredentials.agentId, agents.id))
    .where(and(eq(agents.businessId, businessId), eq(mcpCredentials.mcpName, "notion")))
    .limit(1);

  const row = rows[0];
  if (!row) {
    throw new Error("No Notion MCP credential configured for this business");
  }

  const decrypted = decryptCredential(
    row.iv,
    row.encryptedPayload as McpEncryptedPayload,
  );
  const token = decrypted.token;
  if (typeof token !== "string" || !token.trim()) {
    throw new Error("Notion token missing in MCP credential payload");
  }

  const tasksRaw = decrypted.tasksDatabaseId;
  const tasksDatabaseId =
    typeof tasksRaw === "string" && tasksRaw.trim() ? tasksRaw.trim() : undefined;

  const client = new Client({ auth: token.trim() });
  return { client, tasksDatabaseId };
}

export async function getNotionClient(businessId: string): Promise<Client> {
  const { client } = await resolveNotionForBusiness(businessId);
  return client;
}
