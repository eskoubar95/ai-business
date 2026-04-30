import { getDb } from "@/db/index";
import { agentDocuments, agentSkills, agents, memory } from "@/db/schema";
import { and, desc, eq, isNull, or } from "drizzle-orm";

const SKILL_MD_PATH = "SKILL.md";

/**
 * Returns latest memory blocks for a business, optionally scoped to agent + business-wide rows.
 * Rows are ordered by `updatedAt` descending (recency first in the joined string).
 */
export async function retrieveMemory(
  businessId: string,
  agentId?: string | null,
  limit = 5,
): Promise<string> {
  const db = getDb();
  const lim = Number.isFinite(limit) ? Math.min(Math.max(Number(limit), 1), 50) : 5;
  const scopedAgent = typeof agentId === "string" && agentId.trim() !== "" ? agentId : null;

  const whereExpr =
    scopedAgent !== null
      ? and(
          eq(memory.businessId, businessId),
          or(
            and(eq(memory.scope, "business"), isNull(memory.agentId)),
            and(eq(memory.scope, "agent"), eq(memory.agentId, scopedAgent)),
          ),
        )
      : eq(memory.businessId, businessId);

  const rows = await db.select().from(memory).where(whereExpr).orderBy(desc(memory.updatedAt)).limit(lim);

  return rows.map((r) => r.content).join("\n\n");
}

/**
 * Build a single markdown prefix for Cursor / local agent runs (trusted server caller).
 * `taskType` is reserved for future filtering; currently ignored for MVP.
 */
export async function assembleAgentContext(agentId: string, taskType: string): Promise<string> {
  void taskType;
  const db = getDb();

  const agent = await db.query.agents.findFirst({
    where: eq(agents.id, agentId),
    columns: {
      name: true,
      role: true,
      businessId: true,
    },
  });

  if (!agent) throw new Error("Agent not found");

  const soulDoc = await db.query.agentDocuments.findFirst({
    where: and(eq(agentDocuments.agentId, agentId), eq(agentDocuments.slug, "soul")),
    columns: { content: true },
  });

  const links = await db.query.agentSkills.findMany({
    where: eq(agentSkills.agentId, agentId),
    with: {
      skill: {
        with: {
          files: true,
        },
      },
    },
  });

  const sorted = links
    .map((l) => l.skill)
    .filter((s): s is NonNullable<typeof s> => s !== null && s !== undefined)
    .sort((a, b) => a.name.localeCompare(b.name));

  const skillsMd = sorted
    .map((s) => {
      const md =
        s.files?.find((f) => f.path === SKILL_MD_PATH)?.content ?? "";
      return `## Skill: ${s.name}\n${md}`;
    })
    .join("\n\n");

  const memMd = await retrieveMemory(agent.businessId, agentId, 5);

  const parts: string[] = [
    `# Agent: ${agent.name} (${agent.role})`,
    "## Instructions",
    soulDoc?.content ?? "",
  ];
  if (skillsMd) {
    parts.push("## Attached skills", skillsMd);
  }
  if (memMd) {
    parts.push("## Recent memory", memMd);
  }
  return parts.join("\n\n");
}
