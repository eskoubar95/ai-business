import { describe, expect, it } from "vitest";
import { evaluateShutdownTick, shouldShutdownReady, SHUTDOWN_IDLE_MS } from "../state-machine";

describe("shouldShutdownReady", () => {
  it("requires empty queue, empty in-flight, and 7-minute idle", () => {
    expect(
      shouldShutdownReady({
        queueEmpty: true,
        inFlightEmpty: true,
        elapsedSinceLastActivityMs: SHUTDOWN_IDLE_MS,
      }),
    ).toBe(true);

    expect(
      shouldShutdownReady({
        queueEmpty: false,
        inFlightEmpty: true,
        elapsedSinceLastActivityMs: SHUTDOWN_IDLE_MS + 1,
      }),
    ).toBe(false);

    expect(
      shouldShutdownReady({
        queueEmpty: true,
        inFlightEmpty: false,
        elapsedSinceLastActivityMs: SHUTDOWN_IDLE_MS + 1,
      }),
    ).toBe(false);

    expect(
      shouldShutdownReady({
        queueEmpty: true,
        inFlightEmpty: true,
        elapsedSinceLastActivityMs: SHUTDOWN_IDLE_MS - 1,
      }),
    ).toBe(false);
  });
});

describe("evaluateShutdownTick", () => {
  const t0 = 1_700_000_000_000;

  it("blocks shutdown from warm state when work still queued", () => {
    expect(
      evaluateShutdownTick({
        state: "warm",
        queueDepth: 1,
        inFlightDepth: 0,
        lastActivityAtMs: t0,
        nowMs: t0 + SHUTDOWN_IDLE_MS + 1,
      }),
    ).toEqual({ action: "none" });
  });

  it("fires shutdown from warm when idle long enough", () => {
    expect(
      evaluateShutdownTick({
        state: "warm",
        queueDepth: 0,
        inFlightDepth: 0,
        lastActivityAtMs: t0,
        nowMs: t0 + SHUTDOWN_IDLE_MS,
      }),
    ).toEqual({ action: "shutdown" });
  });

  it("never shuts down from cold (premature path)", () => {
    expect(
      evaluateShutdownTick({
        state: "cold",
        queueDepth: 0,
        inFlightDepth: 0,
        lastActivityAtMs: t0,
        nowMs: t0 + SHUTDOWN_IDLE_MS + 999,
      }),
    ).toEqual({ action: "none" });
  });
});
