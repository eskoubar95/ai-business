import { auth } from "@/lib/auth/server";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import { mergeGrillMeCursorAgentOptions } from "@/lib/grill-me/grill-cursor-runtime";
import { getDb } from "@/db/index";
import { grillMeSessions } from "@/db/schema";
import { runCursorAgent } from "@/lib/cursor/agent";
import { getUserCursorApiKeyDecrypted } from "@/lib/settings/cursor-api-key";
import { desc, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

/** SSE stream derived from Grill-Me transcript (no DB writes here). */
export async function GET(req: NextRequest) {
  const businessId = req.nextUrl.searchParams.get("businessId");
  if (!businessId?.trim()) {
    return new Response("missing businessId", { status: 400 });
  }

  const { data: session } = await auth.getSession();
  const userId = session?.user?.id;
  if (!userId || typeof userId !== "string") {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    await assertUserBusinessAccess(userId, businessId);
  } catch {
    return new Response("Forbidden", { status: 403 });
  }

  const db = getDb();
  const rows = await db
    .select()
    .from(grillMeSessions)
    .where(eq(grillMeSessions.businessId, businessId))
    .orderBy(desc(grillMeSessions.seq));

  const chronological = [...rows].reverse();
  const transcript = chronological.map((r) => `${r.role}: ${r.content}`).join("\n");
  const prompt =
    `# Grill-Me SSE\nStream small progress deltas for UI; repeat context only if needed.\n\n` +
    `## Conversation\n${transcript || "(empty)"}\n`;

  const cursorApiKey = await getUserCursorApiKeyDecrypted();
  const chunks = await runCursorAgent(
    prompt,
    mergeGrillMeCursorAgentOptions(cursorApiKey),
  );
  const encoder = new TextEncoder();

  const body = new ReadableStream({
    async start(controller) {
      try {
        for await (const chunk of chunks) {
          controller.enqueue(encoder.encode(`data: ${chunk}\n\n`));
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
