import { beforeEach, describe, expect, it, vi } from "vitest";

const businessId = "00000000-0000-4000-8000-000000000099";

const store = vi.hoisted(() => ({
  deleteCalled: false,
  hasGrillSession: false,
  hasMemory: false,
}));

vi.mock("@/lib/auth/server", () => ({
  auth: {
    getSession: vi.fn(async () => ({
      data: { user: { id: "test-user-id" } },
    })),
  },
}));

vi.mock("@/lib/grill-me/access", () => ({
  assertUserBusinessAccess: vi.fn(async () => undefined),
}));

vi.mock("@/db/index", () => ({
  getDb() {
    return {
      query: {
        grillMeSessions: {
          findFirst: vi.fn(async () =>
            store.hasGrillSession ? { id: "s1" } : undefined,
          ),
        },
        memory: {
          findFirst: vi.fn(async () =>
            store.hasMemory ? { id: "m1" } : undefined,
          ),
        },
      },
      delete() {
        return {
          where() {
            store.deleteCalled = true;
            return Promise.resolve(undefined);
          },
        };
      },
    };
  },
}));

import { deleteOnboardingDraftBusiness } from "../actions";

describe("deleteOnboardingDraftBusiness", () => {
  beforeEach(() => {
    store.deleteCalled = false;
    store.hasGrillSession = false;
    store.hasMemory = false;
  });

  it("deletes when there are no grill sessions or memory rows", async () => {
    const r = await deleteOnboardingDraftBusiness(businessId);
    expect(r).toEqual({ ok: true });
    expect(store.deleteCalled).toBe(true);
  });

  it("refuses when Grill-Me turns already exist", async () => {
    store.hasGrillSession = true;
    const r = await deleteOnboardingDraftBusiness(businessId);
    expect(r.ok).toBe(false);
    expect(store.deleteCalled).toBe(false);
  });

  it("refuses when memory exists", async () => {
    store.hasMemory = true;
    const r = await deleteOnboardingDraftBusiness(businessId);
    expect(r.ok).toBe(false);
    expect(store.deleteCalled).toBe(false);
  });
});
