import type { UIMessage } from "ai";

import { auth } from "@/lib/auth/server";
import { startGrillMeTurn } from "@/lib/grill-me/actions";
import { assertUserBusinessAccess } from "@/lib/grill-me/access";
import type { GrillBusinessType } from "@/lib/grill-me/grill-prompt";
import { textFromUIMessage } from "@/lib/grill-me/ui-messages";
import {
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateId,
} from "ai";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const businessId =
    typeof body === "object" &&
    body !== null &&
    "businessId" in body &&
    typeof (body as { businessId: unknown }).businessId === "string"
      ? (body as { businessId: string }).businessId.trim()
      : "";

  const message =
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof (body as { message: unknown }).message === "object" &&
    (body as { message: unknown }).message !== null
      ? ((body as { message: UIMessage }).message as UIMessage)
      : null;

  if (!businessId) {
    return Response.json({ error: "businessId required" }, { status: 400 });
  }
  if (!message || message.role !== "user") {
    return Response.json({ error: "Last message must be a user message" }, {
      status: 400,
    });
  }

  const userText = textFromUIMessage(message).trim();
  if (!userText) {
    return Response.json({ error: "Empty message" }, { status: 400 });
  }

  let businessType: GrillBusinessType = "existing";
  if (
    typeof body === "object" &&
    body !== null &&
    "businessType" in body
  ) {
    const bt = (body as { businessType: unknown }).businessType;
    if (bt === "existing" || bt === "new") {
      businessType = bt;
    } else if (bt !== undefined && bt !== null && String(bt).trim() !== "") {
      return Response.json(
        { error: "businessType must be 'existing' or 'new'" },
        { status: 400 },
      );
    }
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

  const stream = createUIMessageStream({
    execute: async ({ writer }) => {
      try {
        const { assistantReply } = await startGrillMeTurn(
          businessId,
          userText,
          businessType,
        );

        const messageId = generateId();
        writer.write({ type: "start", messageId });

        const textId = generateId();
        writer.write({ type: "text-start", id: textId });

        const step = 48;
        for (let i = 0; i < assistantReply.length; i += step) {
          writer.write({
            type: "text-delta",
            id: textId,
            delta: assistantReply.slice(i, i + step),
          });
        }

        writer.write({ type: "text-end", id: textId });
        writer.write({ type: "finish" });
      } catch (err) {
        writer.write({
          type: "error",
          errorText:
            err instanceof Error ? err.message : "Grill-Me turn failed",
        });
      }
    },
  });

  return createUIMessageStreamResponse({ stream });
}
