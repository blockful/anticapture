import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getAddress, parseEther } from "viem";

import { createLogger } from "@anticapture/observability";

import type {
  RelayerStatusChecks,
  RelayerStatusReason,
  RelayerStatusResponse,
} from "@/schemas/status";
import type { ChainProbe } from "@/services/chain/chain-probe";

import {
  MAX_BLOCK_AGE_MS,
  RelayerStatusService,
  STATUS_CACHE_TTL_MS,
  STATUS_CHECK_TIMEOUT_MS,
  STUCK_PENDING_AFTER_MS,
  type RelayerStatusDeps,
} from "./relayer-status";

const silentLogger = createLogger("relayer-status-test");
silentLogger.level = "silent";

const RELAYER = getAddress("0x1111111111111111111111111111111111111111");
const THRESHOLD_WEI = parseEther("0.1");
const BALANCE_WEI = parseEther("1");
const NOW = Date.parse("2026-10-24T12:00:00.000Z");
const MINUTE = 60_000;

const HEALTHY_CHECKS: RelayerStatusChecks = {
  paused: false,
  rpc: "ok",
  balance: "ok",
  rateLimiter: "ok",
  pendingTransactions: "ok",
  recentRelays: "ok",
};

const fail = async (): Promise<never> => {
  throw new Error("unreachable");
};
const hang = (): Promise<never> => new Promise(() => {});

/** A healthy mainnet RPC whose latest block is always fresh; any read can be swapped. */
function createChain(overrides: Partial<ChainProbe> = {}): ChainProbe {
  return {
    chainId: async () => 1,
    latestBlockTimestamp: async () => BigInt(Math.floor(Date.now() / 1000)),
    balance: async () => BALANCE_WEI,
    nonce: async () => 7,
    ...overrides,
  };
}

function createService(overrides: Partial<RelayerStatusDeps> = {}) {
  return new RelayerStatusService(
    {
      paused: false,
      chainId: 1,
      chain: createChain(),
      relayerAddress: RELAYER,
      thresholdWei: THRESHOLD_WEI,
      rateLimitStorage: { ping: async () => {} },
      relayOutcomes: { isFailing: () => false },
      ...overrides,
    },
    silentLogger,
  );
}

function expectedStatus({
  reasons = [],
  checks = {},
  balanceWei = BALANCE_WEI,
}: {
  reasons?: RelayerStatusReason[];
  checks?: Partial<RelayerStatusChecks>;
  balanceWei?: bigint | null;
} = {}): RelayerStatusResponse {
  return {
    available: reasons.length === 0,
    reasons,
    checks: { ...HEALTHY_CHECKS, ...checks },
    ...(balanceWei === null ? {} : { balanceWei: balanceWei.toString() }),
    thresholdWei: THRESHOLD_WEI.toString(),
    checkedAt: new Date(NOW).toISOString(),
  };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe("RelayerStatusService", () => {
  it("reports available when every check passes", async () => {
    const service = createService();

    const status = await service.getStatus();

    expect(status).toEqual(expectedStatus());
  });

  it.each<
    [
      RelayerStatusReason,
      Partial<RelayerStatusDeps>,
      Partial<RelayerStatusChecks>,
    ]
  >([
    ["PAUSED", { paused: true }, { paused: true }],
    [
      "RPC_UNAVAILABLE",
      { chain: createChain({ chainId: fail }) },
      { rpc: "unavailable" },
    ],
    [
      "WRONG_CHAIN",
      { chain: createChain({ chainId: async () => 11155111 }) },
      { rpc: "wrong_chain" },
    ],
    [
      "CHAIN_STALE",
      {
        chain: createChain({
          latestBlockTimestamp: async () =>
            BigInt((NOW - MAX_BLOCK_AGE_MS - 1000) / 1000),
        }),
      },
      { rpc: "stale" },
    ],
    [
      "RATE_LIMITER_UNAVAILABLE",
      { rateLimitStorage: { ping: fail } },
      { rateLimiter: "unavailable" },
    ],
    [
      "RECENT_RELAY_FAILURES",
      { relayOutcomes: { isFailing: () => true } },
      { recentRelays: "failing" },
    ],
  ])("reports %s", async (reason, deps, checks) => {
    const service = createService(deps);

    const status = await service.getStatus();

    expect(status).toEqual(expectedStatus({ reasons: [reason], checks }));
  });

  it("accepts a latest block exactly at the maximum age", async () => {
    const service = createService({
      chain: createChain({
        latestBlockTimestamp: async () =>
          BigInt((NOW - MAX_BLOCK_AGE_MS) / 1000),
      }),
    });

    const status = await service.getStatus();

    expect(status).toEqual(expectedStatus());
  });

  it("reports LOW_BALANCE with the balance it read", async () => {
    const service = createService({
      chain: createChain({ balance: async () => THRESHOLD_WEI - 1n }),
    });

    const status = await service.getStatus();

    expect(status).toEqual(
      expectedStatus({
        reasons: ["LOW_BALANCE"],
        checks: { balance: "low" },
        balanceWei: THRESHOLD_WEI - 1n,
      }),
    );
  });

  it("accepts a balance exactly at the threshold", async () => {
    const service = createService({
      chain: createChain({ balance: async () => THRESHOLD_WEI }),
    });

    const status = await service.getStatus();

    expect(status).toEqual(expectedStatus({ balanceWei: THRESHOLD_WEI }));
  });

  it("reports BALANCE_UNKNOWN, without a balance, when it cannot be read", async () => {
    const service = createService({ chain: createChain({ balance: fail }) });

    const status = await service.getStatus();

    expect(status).toEqual(
      expectedStatus({
        reasons: ["BALANCE_UNKNOWN"],
        checks: { balance: "unknown" },
        balanceWei: null,
      }),
    );
  });

  it("reports a check that hangs as failed once its timeout elapses", async () => {
    const service = createService({
      chain: createChain({ latestBlockTimestamp: hang }),
      rateLimitStorage: { ping: hang },
    });

    const pending = service.getStatus();
    await vi.advanceTimersByTimeAsync(STATUS_CHECK_TIMEOUT_MS);

    expect(await pending).toEqual(
      expectedStatus({
        reasons: ["RPC_UNAVAILABLE", "RATE_LIMITER_UNAVAILABLE"],
        checks: { rpc: "unavailable", rateLimiter: "unavailable" },
      }),
    );
  });

  it("answers, with every failed check in a fixed order, when everything fails", async () => {
    const service = createService({
      paused: true,
      chain: {
        chainId: fail,
        latestBlockTimestamp: fail,
        balance: fail,
        nonce: fail,
      },
      rateLimitStorage: { ping: fail },
      relayOutcomes: { isFailing: () => true },
    });

    const status = await service.getStatus();

    // An unreadable nonce is "unknown" without a reason of its own: the RPC
    // check already reports the RPC that failed it.
    expect(status).toEqual(
      expectedStatus({
        reasons: [
          "PAUSED",
          "RPC_UNAVAILABLE",
          "BALANCE_UNKNOWN",
          "RATE_LIMITER_UNAVAILABLE",
          "RECENT_RELAY_FAILURES",
        ],
        checks: {
          paused: true,
          rpc: "unavailable",
          balance: "unknown",
          rateLimiter: "unavailable",
          pendingTransactions: "unknown",
          recentRelays: "failing",
        },
        balanceWei: null,
      }),
    );
  });

  describe("caching", () => {
    it("reuses an answer for the cache window, then runs the checks again", async () => {
      let balanceReads = 0;
      let balance = BALANCE_WEI;
      const service = createService({
        chain: createChain({
          balance: async () => {
            balanceReads++;
            return balance;
          },
        }),
      });

      const first = await service.getStatus();
      balance = THRESHOLD_WEI - 1n;
      vi.setSystemTime(NOW + STATUS_CACHE_TTL_MS - 1);
      const cached = await service.getStatus();
      vi.setSystemTime(NOW + STATUS_CACHE_TTL_MS);
      const refreshed = await service.getStatus();

      expect(cached).toBe(first);
      expect(refreshed).toEqual({
        ...expectedStatus({
          reasons: ["LOW_BALANCE"],
          checks: { balance: "low" },
          balanceWei: THRESHOLD_WEI - 1n,
        }),
        checkedAt: new Date(NOW + STATUS_CACHE_TTL_MS).toISOString(),
      });
      expect(balanceReads).toBe(2);
    });

    it("shares the run in flight between concurrent callers", async () => {
      let chainIdReads = 0;
      const service = createService({
        chain: createChain({
          chainId: async () => {
            chainIdReads++;
            return 1;
          },
        }),
      });

      const [first, second] = await Promise.all([
        service.getStatus(),
        service.getStatus(),
      ]);

      expect(second).toBe(first);
      expect(chainIdReads).toBe(1);
    });
  });

  describe("pending transactions", () => {
    function createNonceService() {
      const nonces = { pending: 7, latest: 7, failing: false };
      const service = createService({
        chain: createChain({
          nonce: async (_address, blockTag) => {
            if (nonces.failing) throw new Error("rpc unreachable");
            return nonces[blockTag];
          },
        }),
      });

      // Probes are at least a cache window apart, so every one runs the checks.
      const probeAt = async (offsetMs: number) => {
        vi.setSystemTime(NOW + offsetMs);
        const { checks, reasons } = await service.getStatus();
        return { pendingTransactions: checks?.pendingTransactions, reasons };
      };
      return { nonces, probeAt };
    }

    const OK = { pendingTransactions: "ok", reasons: [] };
    const STUCK = {
      pendingTransactions: "stuck",
      reasons: ["PENDING_TRANSACTIONS_STUCK"],
    };

    it("reports stuck once the pending nonce has sat ahead of the mined one for five minutes", async () => {
      const { nonces, probeAt } = createNonceService();
      nonces.pending = 8;

      expect(await probeAt(0)).toEqual(OK);
      expect(
        await probeAt(STUCK_PENDING_AFTER_MS - STATUS_CACHE_TTL_MS),
      ).toEqual(OK);
      expect(await probeAt(STUCK_PENDING_AFTER_MS)).toEqual(STUCK);
    });

    it("restarts the clock when the gap closes", async () => {
      const { nonces, probeAt } = createNonceService();

      nonces.pending = 8;
      expect(await probeAt(0)).toEqual(OK);
      nonces.pending = 7;
      expect(await probeAt(3 * MINUTE)).toEqual(OK);
      nonces.pending = 8;
      expect(await probeAt(4 * MINUTE)).toEqual(OK);

      expect(await probeAt(STUCK_PENDING_AFTER_MS)).toEqual(OK);
      expect(await probeAt(4 * MINUTE + STUCK_PENDING_AFTER_MS)).toEqual(STUCK);
    });

    it("restarts the clock while the mined nonce keeps moving", async () => {
      const { nonces, probeAt } = createNonceService();

      nonces.pending = 9;
      expect(await probeAt(0)).toEqual(OK);
      // Still a gap, but a transaction was mined: the queue is draining.
      nonces.pending = 10;
      nonces.latest = 8;
      expect(await probeAt(3 * MINUTE)).toEqual(OK);

      expect(await probeAt(STUCK_PENDING_AFTER_MS)).toEqual(OK);
      expect(await probeAt(3 * MINUTE + STUCK_PENDING_AFTER_MS)).toEqual(STUCK);
    });

    it("reports unknown, without a reason, when the nonces cannot be read, and keeps the clock", async () => {
      const { nonces, probeAt } = createNonceService();

      nonces.pending = 8;
      expect(await probeAt(0)).toEqual(OK);
      nonces.failing = true;
      expect(await probeAt(3 * MINUTE)).toEqual({
        pendingTransactions: "unknown",
        reasons: [],
      });
      nonces.failing = false;
      expect(await probeAt(STUCK_PENDING_AFTER_MS)).toEqual(STUCK);
    });
  });
});
