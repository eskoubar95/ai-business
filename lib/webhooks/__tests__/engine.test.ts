import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  WEBHOOK_DELIVERED_STATUS,
  WEBHOOK_FAILED_STATUS,
  WEBHOOK_PENDING_STATUS,
  deliverWebhook,
  type WebhookDeliveryAdapter,
} from "@/lib/webhooks/engine";

const logEvent = vi.hoisted(() => vi.fn(async () => "evt"));

vi.mock("@/lib/orchestration/events", () => ({
  logEvent,
}));

function createMemoryAdapter() {
  const rows = new Map<
    string,
    { id: string; status: string; businessId: string; type: string; payload: Record<string, unknown> }
  >();
  let seq = 0;

  const adapter: WebhookDeliveryAdapter = {
    async findByIdempotencyKey(idempotencyKey) {
      const r = rows.get(idempotencyKey);
      return r ? { id: r.id, status: r.status } : null;
    },
    async insertPending({ businessId, type, payload, idempotencyKey }) {
      seq += 1;
      const id = `d-${seq}`;
      rows.set(idempotencyKey, {
        id,
        status: WEBHOOK_PENDING_STATUS,
        businessId,
        type,
        payload,
      });
      return { id };
    },
    async markDelivered(id) {
      for (const [, v] of rows) {
        if (v.id === id) v.status = WEBHOOK_DELIVERED_STATUS;
      }
    },
    async markFailed(id, _lastError) {
      for (const [, v] of rows) {
        if (v.id === id) v.status = WEBHOOK_FAILED_STATUS;
      }
    },
    async requeueFailed(id) {
      for (const [, v] of rows) {
        if (v.id === id) v.status = WEBHOOK_PENDING_STATUS;
      }
    },
  };
  return { adapter, rows };
}

describe("deliverWebhook", () => {
  beforeEach(() => {
    logEvent.mockClear();
  });

  it("runs once and marks delivered", async () => {
    const { adapter } = createMemoryAdapter();
    const r = await deliverWebhook("ping", "biz-1", { a: 1 }, "idem-1", {
      adapter,
    });
    expect(r.skipped).toBe(false);
    const r2 = await deliverWebhook("ping", "biz-1", { a: 1 }, "idem-1", {
      adapter,
    });
    expect(r2.skipped).toBe(true);
    expect(logEvent).toHaveBeenCalledTimes(1);
  });

  it("skips when another delivery is pending", async () => {
    const { adapter } = createMemoryAdapter();
    await adapter.insertPending({
      businessId: "biz",
      type: "t",
      payload: {},
      idempotencyKey: "k",
    });
    const r = await deliverWebhook("t", "biz", {}, "k", {
      adapter,
      process: async () => {},
    });
    expect(r.skipped).toBe(true);
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("can retry after failed", async () => {
    const { adapter } = createMemoryAdapter();
    let attempts = 0;
    await deliverWebhook("t", "biz", {}, "k2", {
      adapter,
      process: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("boom");
      },
    }).catch(() => {});

    await deliverWebhook("t", "biz", {}, "k2", {
      adapter,
      process: async () => {},
    });

    const st = await adapter.findByIdempotencyKey("k2");
    expect(st?.status).toBe(WEBHOOK_DELIVERED_STATUS);
  });
});
