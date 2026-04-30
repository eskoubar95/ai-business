import { getDb } from "@/db/index";
import { webhookDeliveries } from "@/db/schema";
import { logEvent } from "@/lib/orchestration/events";
import { eq, sql } from "drizzle-orm";

export const WEBHOOK_DELIVERED_STATUS = "delivered";
export const WEBHOOK_PENDING_STATUS = "pending";
export const WEBHOOK_FAILED_STATUS = "failed";

export type WebhookDeliveryAdapter = {
  findByIdempotencyKey: (
    idempotencyKey: string,
  ) => Promise<{ id: string; status: string } | null>;
  insertPending: (row: {
    businessId: string;
    type: string;
    payload: Record<string, unknown>;
    idempotencyKey: string;
  }) => Promise<{ id: string }>;
  markDelivered: (id: string) => Promise<void>;
  markFailed: (id: string, lastError: string) => Promise<void>;
  /** Re-queue a previously failed delivery (increments `attempts`). */
  requeueFailed: (id: string) => Promise<void>;
};

function drizzleAdapter(): WebhookDeliveryAdapter {
  const db = getDb();
  return {
    async findByIdempotencyKey(idempotencyKey) {
      const row = await db.query.webhookDeliveries.findFirst({
        where: eq(webhookDeliveries.idempotencyKey, idempotencyKey),
        columns: { id: true, status: true },
      });
      return row ?? null;
    },
    async insertPending({ businessId, type, payload, idempotencyKey }) {
      const [row] = await db
        .insert(webhookDeliveries)
        .values({
          businessId,
          type,
          payload,
          idempotencyKey,
          status: WEBHOOK_PENDING_STATUS,
          attempts: 0,
        })
        .returning({ id: webhookDeliveries.id });
      if (!row) throw new Error("Failed to insert webhook delivery");
      return row;
    },
    async markDelivered(id) {
      await db
        .update(webhookDeliveries)
        .set({
          status: WEBHOOK_DELIVERED_STATUS,
          updatedAt: new Date(),
          lastError: null,
        })
        .where(eq(webhookDeliveries.id, id));
    },
    async markFailed(id, lastError) {
      await db
        .update(webhookDeliveries)
        .set({
          status: WEBHOOK_FAILED_STATUS,
          lastError,
          updatedAt: new Date(),
        })
        .where(eq(webhookDeliveries.id, id));
    },
    async requeueFailed(id) {
      await db
        .update(webhookDeliveries)
        .set({
          status: WEBHOOK_PENDING_STATUS,
          lastError: null,
          updatedAt: new Date(),
          attempts: sql`${webhookDeliveries.attempts} + 1`,
        })
        .where(eq(webhookDeliveries.id, id));
    },
  };
}

/**
 * Idempotent webhook delivery: one row per `idempotencyKey`. If already `delivered`, skips work.
 * If `pending`, skips (assumed in-flight). Failed rows may be re-queued once per call.
 */
export async function deliverWebhook(
  type: string,
  businessId: string,
  payload: Record<string, unknown>,
  idempotencyKey: string,
  options?: {
    process?: () => Promise<void>;
    adapter?: WebhookDeliveryAdapter;
  },
): Promise<{ skipped: boolean; deliveryId: string }> {
  const adapter = options?.adapter ?? drizzleAdapter();
  const processFn =
    options?.process ??
    (async () => {
      await logEvent({
        type: "webhook.processed",
        businessId,
        payload: { webhookType: type, body: payload },
        status: "succeeded",
        correlationKey: idempotencyKey,
      });
    });

  let existing = await adapter.findByIdempotencyKey(idempotencyKey);
  if (existing?.status === WEBHOOK_DELIVERED_STATUS) {
    return { skipped: true, deliveryId: existing.id };
  }
  if (existing?.status === WEBHOOK_PENDING_STATUS) {
    return { skipped: true, deliveryId: existing.id };
  }
  if (existing?.status === WEBHOOK_FAILED_STATUS) {
    await adapter.requeueFailed(existing.id);
    existing = await adapter.findByIdempotencyKey(idempotencyKey);
  }

  let deliveryId: string;
  if (existing && existing.status === WEBHOOK_PENDING_STATUS) {
    deliveryId = existing.id;
  } else if (!existing) {
    try {
      const row = await adapter.insertPending({
        businessId,
        type,
        payload,
        idempotencyKey,
      });
      deliveryId = row.id;
    } catch {
      const race = await adapter.findByIdempotencyKey(idempotencyKey);
      if (race?.status === WEBHOOK_DELIVERED_STATUS) {
        return { skipped: true, deliveryId: race.id };
      }
      if (race?.status === WEBHOOK_PENDING_STATUS) {
        return { skipped: true, deliveryId: race.id };
      }
      if (!race) throw new Error("Webhook insert failed without race row");
      deliveryId = race.id;
    }
  } else {
    deliveryId = existing.id;
  }

  try {
    await processFn();
    await adapter.markDelivered(deliveryId);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await adapter.markFailed(deliveryId, message);
    throw err;
  }

  return { skipped: false, deliveryId };
}
