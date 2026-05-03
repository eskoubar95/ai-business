import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  class MockAuthenticationError extends Error {
    name = "AuthenticationError";
  }
  class MockCursorSdkError extends Error {
    status?: number;
    declare name: string;
    constructor(message: string, opts?: { status?: number }) {
      super(message);
      this.name = "CursorSdkError";
      this.status = opts?.status;
    }
  }
  class MockNetworkError extends Error {
    name = "NetworkError";
  }
  class MockRateLimitError extends Error {
    readonly status = 429;
    name = "RateLimitError";
  }
  return {
    cursorMe: vi.fn(),
    MockAuthenticationError,
    MockCursorSdkError,
    MockNetworkError,
    MockRateLimitError,
  };
});

vi.mock("@cursor/sdk", () => ({
  Cursor: {
    me: (...args: unknown[]) => mocks.cursorMe(...args),
  },
  AuthenticationError: mocks.MockAuthenticationError,
  CursorSdkError: mocks.MockCursorSdkError,
  NetworkError: mocks.MockNetworkError,
  RateLimitError: mocks.MockRateLimitError,
}));

describe("verifyCursorApiKey", () => {
  const originalSkip = process.env.CURSOR_API_VERIFY_SKIP;

  beforeEach(() => {
    mocks.cursorMe.mockReset();
    vi.stubEnv("NODE_ENV", "test");
    delete process.env.CURSOR_API_VERIFY_SKIP;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    if (originalSkip === undefined) delete process.env.CURSOR_API_VERIFY_SKIP;
    else process.env.CURSOR_API_VERIFY_SKIP = originalSkip;
  });

  it("returns ok when Cursor.me succeeds", async () => {
    mocks.cursorMe.mockResolvedValueOnce({ apiKeyName: "k", createdAt: "" });
    const { verifyCursorApiKey } = await import("@/lib/cursor/verify-api-key.js");
    const r = await verifyCursorApiKey("sk-test");
    expect(r).toEqual({ ok: true });
    expect(mocks.cursorMe).toHaveBeenCalledWith({ apiKey: "sk-test" });
  });

  it("maps AuthenticationError to invalid_credentials", async () => {
    mocks.cursorMe.mockRejectedValueOnce(new mocks.MockAuthenticationError("bad"));
    const { verifyCursorApiKey } = await import("@/lib/cursor/verify-api-key.js");
    const r = await verifyCursorApiKey("sk-test");
    expect(r).toEqual({ ok: false, reason: "invalid_credentials" });
  });

  it("maps NetworkError to network", async () => {
    mocks.cursorMe.mockRejectedValueOnce(new mocks.MockNetworkError("down"));
    const { verifyCursorApiKey } = await import("@/lib/cursor/verify-api-key.js");
    const r = await verifyCursorApiKey("sk-test");
    expect(r).toEqual({ ok: false, reason: "network" });
  });

  it("maps HTTP 429 on CursorSdkError to rate_limited", async () => {
    mocks.cursorMe.mockRejectedValueOnce(
      new mocks.MockCursorSdkError("slow down", { status: 429 }),
    );
    const { verifyCursorApiKey } = await import("@/lib/cursor/verify-api-key.js");
    const r = await verifyCursorApiKey("sk-test");
    expect(r).toEqual({ ok: false, reason: "rate_limited" });
  });

  it("maps empty key to invalid_credentials without calling Cursor", async () => {
    const { verifyCursorApiKey } = await import("@/lib/cursor/verify-api-key.js");
    const r = await verifyCursorApiKey("   ");
    expect(r).toEqual({ ok: false, reason: "invalid_credentials" });
    expect(mocks.cursorMe).not.toHaveBeenCalled();
  });

  it("skips network when CURSOR_API_VERIFY_SKIP=1 and not production", async () => {
    process.env.CURSOR_API_VERIFY_SKIP = "1";
    vi.stubEnv("NODE_ENV", "development");
    const { verifyCursorApiKey } = await import("@/lib/cursor/verify-api-key.js");
    const r = await verifyCursorApiKey("any");
    expect(r).toEqual({ ok: true });
    expect(mocks.cursorMe).not.toHaveBeenCalled();
  });
});
