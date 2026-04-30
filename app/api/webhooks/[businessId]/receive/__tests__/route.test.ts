import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const verifySignature = vi.hoisted(() => vi.fn(() => true));
const logEvent = vi.hoisted(() => vi.fn(async () => "evt-1"));

vi.mock("@/lib/webhooks/hmac", () => ({
  verifySignature,
}));

vi.mock("@/lib/orchestration/events", () => ({
  logEvent,
}));

const mockDb = vi.hoisted(() => ({
  query: {
    webhookDeliveries: {
      findFirst: vi.fn(),
    },
  },
  insert: vi.fn(),
}));

vi.mock("@/db/index", () => ({
  getDb: () => mockDb,
}));

describe("POST /api/webhooks/[businessId]/receive", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifySignature.mockReturnValue(true);
    mockDb.query.webhookDeliveries.findFirst.mockResolvedValue(null);
    mockDb.insert.mockReturnValue({
      values: () => Promise.resolve(undefined),
    });
    process.env.WEBHOOK_SECRET = "test-secret";
  });

  it("returns 400 without idempotency key", async () => {
    const mod = await import("../route");
    const req = new NextRequest("http://localhost/api/webhooks/biz-1/receive", {
      method: "POST",
      body: JSON.stringify({ event_type: "ping" }),
    });
    const res = await mod.POST(req, { params: Promise.resolve({ businessId: "biz-1" }) });
    expect(res.status).toBe(400);
  });

  it("returns 401 when signature invalid", async () => {
    verifySignature.mockReturnValue(false);
    const mod = await import("../route");
    const req = new NextRequest("http://localhost/api/webhooks/biz-1/receive", {
      method: "POST",
      headers: {
        "X-Idempotency-Key": "k-1",
        "X-Webhook-Signature": "bad",
      },
      body: JSON.stringify({ event_type: "ping" }),
    });
    const res = await mod.POST(req, { params: Promise.resolve({ businessId: "biz-1" }) });
    expect(res.status).toBe(401);
  });

  it("returns 202 and records orchestration on success", async () => {
    const mod = await import("../route");
    const body = { event_type: "deploy.ready", foo: 1 };
    const req = new NextRequest("http://localhost/api/webhooks/biz-1/receive", {
      method: "POST",
      headers: {
        "X-Idempotency-Key": "k-success",
        "X-Webhook-Signature": "hexsig",
      },
      body: JSON.stringify(body),
    });
    const res = await mod.POST(req, { params: Promise.resolve({ businessId: "biz-1" }) });
    expect(res.status).toBe(202);
    expect(verifySignature).toHaveBeenCalled();
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "webhook_trigger",
        businessId: "biz-1",
        payload: expect.objectContaining({ event_type: "deploy.ready" }),
      }),
    );
  });

  it("returns 202 without duplicating when idempotency key exists", async () => {
    mockDb.query.webhookDeliveries.findFirst.mockResolvedValue({ id: "d1" });
    const mod = await import("../route");
    const req = new NextRequest("http://localhost/api/webhooks/biz-1/receive", {
      method: "POST",
      headers: {
        "X-Idempotency-Key": "k-dup",
        "X-Webhook-Signature": "hex",
      },
      body: JSON.stringify({ event_type: "x" }),
    });
    const res = await mod.POST(req, { params: Promise.resolve({ businessId: "biz-1" }) });
    expect(res.status).toBe(202);
    expect(mockDb.insert).not.toHaveBeenCalled();
    expect(logEvent).not.toHaveBeenCalled();
  });
});
