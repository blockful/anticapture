import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAddress, InsufficientFundsError, type Hash } from "viem";

import type { RelayerSigner } from "@/signer/types";

import {
  RECENT_FAILURE_THRESHOLD,
  RECENT_FAILURE_WINDOW_MS,
  RelayOutcomeTracker,
  trackBroadcasts,
} from "./relay-outcome-tracker";

const NOW = Date.parse("2026-10-24T12:00:00.000Z");
const MINUTE = 60_000;
const RELAYER = getAddress("0x1111111111111111111111111111111111111111");
const TX_HASH: Hash = `0x${"ab".repeat(32)}`;
const TX = {
  to: getAddress("0x2222222222222222222222222222222222222222"),
  data: "0xdeadbeef" as const,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("RelayOutcomeTracker", () => {
  let tracker: RelayOutcomeTracker;

  beforeEach(() => {
    tracker = new RelayOutcomeTracker();
  });

  const failAt = (offsetMs: number) => {
    vi.setSystemTime(NOW + offsetMs);
    tracker.recordFailure();
  };

  const isFailingAt = (offsetMs: number) => {
    vi.setSystemTime(NOW + offsetMs);
    return tracker.isFailing();
  };

  it("is not failing before any broadcast", () => {
    expect(tracker.isFailing()).toBe(false);
  });

  it("is not failing below the threshold", () => {
    for (let i = 0; i < RECENT_FAILURE_THRESHOLD - 1; i++) failAt(i * MINUTE);

    expect(isFailingAt(RECENT_FAILURE_THRESHOLD * MINUTE)).toBe(false);
  });

  it("is failing once the threshold is reached inside the window", () => {
    failAt(0);
    failAt(1 * MINUTE);
    failAt(2 * MINUTE);

    expect(isFailingAt(2 * MINUTE)).toBe(true);
  });

  it("does not add up failures further apart than the window", () => {
    failAt(0);
    failAt(6 * MINUTE);
    failAt(RECENT_FAILURE_WINDOW_MS + 1 * MINUTE);

    expect(isFailingAt(RECENT_FAILURE_WINDOW_MS + 1 * MINUTE)).toBe(false);
  });

  it("stays failing until a window has passed since the latest failure", () => {
    failAt(0);
    failAt(1 * MINUTE);
    failAt(2 * MINUTE);

    expect(isFailingAt(2 * MINUTE + RECENT_FAILURE_WINDOW_MS - 1)).toBe(true);
    expect(isFailingAt(2 * MINUTE + RECENT_FAILURE_WINDOW_MS)).toBe(false);
  });

  it("clears on the next success, and counts afresh after it", () => {
    failAt(0);
    failAt(1 * MINUTE);
    failAt(2 * MINUTE);

    tracker.recordSuccess();
    expect(tracker.isFailing()).toBe(false);

    failAt(3 * MINUTE);
    failAt(4 * MINUTE);
    expect(tracker.isFailing()).toBe(false);
  });
});

describe("trackBroadcasts", () => {
  function createRecorder() {
    const outcomes: ("success" | "failure")[] = [];
    return {
      outcomes,
      recordSuccess: () => outcomes.push("success"),
      recordFailure: () => outcomes.push("failure"),
    };
  }

  it("passes the transaction through and records a success", async () => {
    const sent: unknown[] = [];
    const signer: RelayerSigner = {
      getAddress: async () => RELAYER,
      sendTransaction: async (tx) => {
        sent.push(tx);
        return TX_HASH;
      },
    };
    const recorder = createRecorder();
    const tracked = trackBroadcasts(signer, recorder);

    const hash = await tracked.sendTransaction(TX);

    expect(hash).toBe(TX_HASH);
    expect(sent).toEqual([TX]);
    expect(recorder.outcomes).toEqual(["success"]);
    expect(await tracked.getAddress()).toBe(RELAYER);
  });

  it("records a failure and rethrows it untouched", async () => {
    const insufficientFunds = new InsufficientFundsError();
    const signer: RelayerSigner = {
      getAddress: async () => RELAYER,
      sendTransaction: async () => {
        throw insufficientFunds;
      },
    };
    const recorder = createRecorder();

    await expect(
      trackBroadcasts(signer, recorder).sendTransaction(TX),
    ).rejects.toBe(insufficientFunds);
    expect(recorder.outcomes).toEqual(["failure"]);
  });
});
