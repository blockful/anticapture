import { createPublicClient, custom, zeroAddress } from "viem";
import { mainnet } from "viem/chains";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProposalStatus } from "../lib/constants";
import { GovernorBase } from "./governor.base";

// viem retries a failing transport request on a timer. Disabling the retry
// keeps RPC call counts exact and keeps the suite free of timer-driven waiting.
const NO_RETRY = { retryCount: 0 } as const;

// Lets a floating background refresh settle without moving the faked clock.
const flushMicrotasks = async () => {
  for (let i = 0; i < 20; i += 1) {
    await Promise.resolve();
  }
};

class TestGovernor extends GovernorBase {
  protected address = zeroAddress;
  protected abi = [];

  timelockDelayFetches = 0;
  gracePeriodReads = 0;
  quorumReads = 0;

  calculateQuorum(): bigint {
    return 0n;
  }

  getQuorum(): Promise<bigint> {
    return this.getCachedQuorum(async () => {
      this.quorumReads += 1;
      return 1n;
    });
  }

  protected async fetchTimelockDelay(): Promise<bigint> {
    this.timelockDelayFetches += 1;
    return 0n;
  }

  async getGracePeriod(): Promise<bigint | null> {
    this.gracePeriodReads += 1;
    return null;
  }
}

/** Governor whose transport fails loudly, so any RPC read shows up as an error. */
const createOfflineGovernor = () =>
  new TestGovernor(
    createPublicClient({
      chain: mainnet,
      transport: custom(
        {
          request: async () => {
            throw new Error("unexpected RPC call");
          },
        },
        NO_RETRY,
      ),
    }),
  );

const buildProposal = (status: ProposalStatus) => ({
  id: "1",
  status,
  startBlock: 100,
  endBlock: 200,
  forVotes: 0n,
  againstVotes: 0n,
  abstainVotes: 0n,
  endTimestamp: 0n,
});

describe("GovernorBase", () => {
  it("should use one latest-block RPC for current block and timestamp", async () => {
    let latestBlockCalls = 0;
    const client = createPublicClient({
      chain: mainnet,
      transport: custom(
        {
          request: async ({ method, params }) => {
            if (method !== "eth_getBlockByNumber") {
              throw new Error(`Unexpected method: ${method}`);
            }

            expect(params).toEqual(["latest", false]);
            latestBlockCalls++;
            return {
              number: "0x7b",
              timestamp: "0x64",
            };
          },
        },
        NO_RETRY,
      ),
    });
    const governor = new TestGovernor(client);

    const blockNumber = await governor.getCurrentBlockNumber();
    const timestamp = await governor.getBlockTime(blockNumber);

    expect({ blockNumber, timestamp, latestBlockCalls }).toEqual({
      blockNumber: 123,
      timestamp: 100,
      latestBlockCalls: 1,
    });
  });

  describe("latest block stale-while-revalidate", () => {
    const LATEST_BLOCK_TTL_MS = 7_000;
    const RETRY_BACKOFF_MS = 3_000;
    const MAX_STALE_MS = 60_000;

    beforeEach(() => {
      vi.useFakeTimers();
      vi.setSystemTime(0);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function createGovernor(blocks: Array<{ number: string } | Error>) {
      let calls = 0;
      const client = createPublicClient({
        chain: mainnet,
        transport: custom(
          {
            request: async () => {
              const next = blocks[Math.min(calls, blocks.length - 1)];
              calls++;
              if (next === undefined) {
                throw new Error("No block configured for this call");
              }
              if (next instanceof Error) throw next;
              return { number: next.number, timestamp: "0x64" };
            },
          },
          NO_RETRY,
        ),
      });
      return { governor: new TestGovernor(client), rpcCalls: () => calls };
    }

    it("should serve the cached block immediately and refresh in the background after the TTL", async () => {
      const { governor, rpcCalls } = createGovernor([
        { number: "0x7b" },
        { number: "0x7c" },
      ]);

      expect(await governor.getCurrentBlockNumber()).toBe(123);
      expect(rpcCalls()).toBe(1);
      vi.setSystemTime(LATEST_BLOCK_TTL_MS);

      // Expired entry: the request is answered from cache, not by the RPC.
      expect(await governor.getCurrentBlockNumber()).toBe(123);
      expect(rpcCalls()).toBe(2);

      await flushMicrotasks();
      expect(await governor.getCurrentBlockNumber()).toBe(124);
      expect(rpcCalls()).toBe(2);
    });

    it("should keep serving the stale block and back off when the refresh fails", async () => {
      const { governor, rpcCalls } = createGovernor([
        { number: "0x7b" },
        new Error("rpc down"),
      ]);

      expect(await governor.getCurrentBlockNumber()).toBe(123);
      vi.setSystemTime(LATEST_BLOCK_TTL_MS);

      expect(await governor.getCurrentBlockNumber()).toBe(123);
      expect(rpcCalls()).toBe(2);
      await flushMicrotasks();

      // Within the retry backoff the failed RPC is not probed again.
      vi.setSystemTime(LATEST_BLOCK_TTL_MS + RETRY_BACKOFF_MS - 1);
      expect(await governor.getCurrentBlockNumber()).toBe(123);
      expect(rpcCalls()).toBe(2);

      vi.setSystemTime(LATEST_BLOCK_TTL_MS + RETRY_BACKOFF_MS);
      expect(await governor.getCurrentBlockNumber()).toBe(123);
      await flushMicrotasks();
      expect(rpcCalls()).toBe(3);
    });

    it("should wait for the RPC again once the cached block is older than the stale bound", async () => {
      const { governor, rpcCalls } = createGovernor([
        { number: "0x7b" },
        { number: "0x7c" },
      ]);

      expect(await governor.getCurrentBlockNumber()).toBe(123);
      vi.setSystemTime(MAX_STALE_MS + 1);

      // Not served from cache any more: the call awaits the refresh.
      expect(await governor.getCurrentBlockNumber()).toBe(124);
      expect(rpcCalls()).toBe(2);
    });

    it("should surface the RPC failure instead of a block older than the stale bound", async () => {
      const { governor, rpcCalls } = createGovernor([
        { number: "0x7b" },
        new Error("rpc down"),
      ]);

      expect(await governor.getCurrentBlockNumber()).toBe(123);
      vi.setSystemTime(MAX_STALE_MS + 1);

      // Past the bound the stale block would misreport proposal statuses, so
      // callers see the failure and fall back to indexed state.
      await expect(governor.getCurrentBlockNumber()).rejects.toThrow(
        "rpc down",
      );
      expect(rpcCalls()).toBe(2);

      // Inside the retry backoff the RPC is not hammered; the call still fails.
      vi.setSystemTime(MAX_STALE_MS + 2);
      await expect(governor.getCurrentBlockNumber()).rejects.toThrow(
        "last RPC refresh failed",
      );
      expect(rpcCalls()).toBe(2);

      // Once the backoff elapses the RPC is probed again.
      vi.setSystemTime(MAX_STALE_MS + 1 + RETRY_BACKOFF_MS);
      await expect(governor.getCurrentBlockNumber()).rejects.toThrow(
        "rpc down",
      );
      expect(rpcCalls()).toBe(3);
    });

    it("should back off a failing RPC even when no block was ever cached", async () => {
      const { governor, rpcCalls } = createGovernor([new Error("rpc down")]);

      await expect(governor.getCurrentBlockNumber()).rejects.toThrow(
        "rpc down",
      );
      expect(rpcCalls()).toBe(1);

      // No cache entry to hang the backoff on, yet the RPC is still not
      // re-probed until the retry window elapses.
      vi.setSystemTime(RETRY_BACKOFF_MS - 1);
      await expect(governor.getCurrentBlockNumber()).rejects.toThrow(
        "Latest block is unavailable and the last RPC refresh failed",
      );
      expect(rpcCalls()).toBe(1);

      vi.setSystemTime(RETRY_BACKOFF_MS);
      await expect(governor.getCurrentBlockNumber()).rejects.toThrow(
        "rpc down",
      );
      expect(rpcCalls()).toBe(2);
    });
  });

  it("should dedupe concurrent timelock delay fetches", async () => {
    const governor = createOfflineGovernor();

    const delays = await Promise.all([
      governor.getTimelockDelay(),
      governor.getTimelockDelay(),
      governor.getTimelockDelay(),
    ]);

    expect(delays).toEqual([0n, 0n, 0n]);
    expect(governor.timelockDelayFetches).toBe(1);
  });

  it("should share one cold quorum read across concurrent callers", async () => {
    const governor = createOfflineGovernor();

    const quorums = await Promise.all(
      Array.from({ length: 5 }, () => governor.getQuorum()),
    );

    expect({ quorums, quorumReads: governor.quorumReads }).toEqual({
      quorums: [1n, 1n, 1n, 1n, 1n],
      quorumReads: 1,
    });

    // The warm cache serves later callers without another read.
    expect(await governor.getQuorum()).toBe(1n);
    expect(governor.quorumReads).toBe(1);
  });

  describe("proposal status", () => {
    it("should not read the timelock delay or grace period when nothing is queued", async () => {
      const governor = createOfflineGovernor();

      const status = await governor.getProposalStatus(
        buildProposal(ProposalStatus.ACTIVE),
        150,
        1_000,
      );

      expect({
        status,
        timelockDelayFetches: governor.timelockDelayFetches,
        gracePeriodReads: governor.gracePeriodReads,
      }).toEqual({
        status: ProposalStatus.ACTIVE,
        timelockDelayFetches: 0,
        gracePeriodReads: 0,
      });
    });

    it("should read the timelock delay and grace period for a queued proposal", async () => {
      const governor = createOfflineGovernor();

      const status = await governor.getProposalStatus(
        buildProposal(ProposalStatus.QUEUED),
        250,
        1_000,
      );

      expect({
        status,
        timelockDelayFetches: governor.timelockDelayFetches,
        gracePeriodReads: governor.gracePeriodReads,
      }).toEqual({
        status: ProposalStatus.PENDING_EXECUTION,
        timelockDelayFetches: 1,
        gracePeriodReads: 1,
      });
    });

    it("should still compute block-based statuses without a head timestamp", async () => {
      const governor = createOfflineGovernor();

      // The RPC gave a block number but no timestamp: only the queued
      // comparisons are lost, the block ladder still runs.
      const status = await governor.getProposalStatus(
        buildProposal(ProposalStatus.ACTIVE),
        150,
        null,
      );

      expect({
        status,
        timelockDelayFetches: governor.timelockDelayFetches,
      }).toEqual({ status: ProposalStatus.ACTIVE, timelockDelayFetches: 0 });
    });
  });
});
