import { getDb } from "@/db/index";
import { agents } from "@/db/schema";
import { logEvent } from "@/lib/orchestration/events";
import { and, eq, sql } from "drizzle-orm";

const MENTION_REGEX = /@([^\s@]+)/g;

/**
 * Extract unique @handles from markdown-ish log content (first capture group per match).
 */
export function extractMentionHandles(content: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const match of content.matchAll(MENTION_REGEX)) {
    const raw = match[1]?.trim();
    if (!raw) continue;
    const key = raw.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(raw);
  }
  return out;
}

function excerptAroundMention(content: string, handle: string): string {
  const idx = content.toLowerCase().indexOf(`@${handle.toLowerCase()}`);
  if (idx < 0) return content.slice(0, 120);
  const start = Math.max(0, idx - 40);
  const end = Math.min(content.length, idx + handle.length + 80);
  const slice = content.slice(start, end).replace(/\s+/g, " ").trim();
  return slice.length > 200 ? `${slice.slice(0, 197)}…` : slice;
}

/**
 * For each @agentName in `logContent`, find agents in `businessId` with a case-insensitive name match
 * and insert `orchestration_events` rows (`type: mention_trigger`).
 */
export async function parseAndTriggerMentions(
  taskId: string,
  logContent: string,
  businessId: string,
): Promise<void> {
  const handles = extractMentionHandles(logContent);
  if (handles.length === 0) return;

  const db = getDb();
  const notified = new Set<string>();

  for (const handle of handles) {
    const matches = await db.query.agents.findMany({
      where: and(
        eq(agents.businessId, businessId),
        sql`lower(${agents.name}) = lower(${handle})`,
      ),
      columns: { id: true },
    });

    for (const agent of matches) {
      if (notified.has(agent.id)) continue;
      notified.add(agent.id);
      await logEvent({
        type: "mention_trigger",
        businessId,
        payload: {
          agentId: agent.id,
          taskId,
          trigger: "mention",
          excerpt: excerptAroundMention(logContent, handle),
        },
        status: "pending",
      });
    }
  }
}
