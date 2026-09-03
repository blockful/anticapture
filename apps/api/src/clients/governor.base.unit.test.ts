import { createPublicClient, custom, zeroAddress } from "viem";
import { mainnet } from "viem/chains";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GovernorBase } from "./governor.base";

class TestGovernor extends GovernorBase {
  protected address = zeroAddress;
  protected abi = [];

  calculateQuorum(): bigint {
    return 0n;
  }

  getQuorum(): Promise<bigint> {
    return this.getCachedQuorum(async () => 1n);
  }

  timelockDelayFetches = 0;

  protected async fetchTimelockDelay(): Promise<bigint> {
    this.timelockDelayFetches++;
    return 0n;
  }
}

describe("GovernorBase", () => {
  it("should use one latest-block RPC for current block and timestamp", async () => {
    let latestBlockCalls = 0;
    const client = createPublicClient({
      chain: mainnet,
      transport: custom({
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
      }),
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

    beforeEach(() => {
      vi.useFakeTimers({ toFake: ["Date"] });
      vi.setSystemTime(0);
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    function createGovernor(blocks: Array<{ number: string } | Error>) {
      let calls = 0;
      const client = createPublicClient({
        chain: mainnet,
        transport: custom({
          request: async () => {
            const next = blocks[Math.min(calls, blocks.length - 1)]!;
            calls++;
            if (next instanceof Error) throw next;
            return { number: next.number, timestamp: "0x64" };
          },
        }),
      });
      return { governor: new TestGovernor(client), rpcCalls: () => calls };
    }

    it("should serve the cached block immediately and refresh in the background after the TTL", async () => {
      const { governor, rpcCalls } = createGovernor([
        { number: "0x7b" },
        { number: "0x7c" },
      ]);

      expect(await governor.getCurrentBlockNumber()).toBe(123);
      vi.setSystemTime(LATEST_BLOCK_TTL_MS);

      // Expired entry: the request is answered from cache, not by the RPC.
      expect(await governor.getCurrentBlockNumber()).toBe(123);
      expect(rpcCalls()).toBe(2);

      await vi.waitFor(async () =>
        expect(await governor.getCurrentBlockNumber()).toBe(124),
      );
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

      // Within the retry backoff the failed RPC is not probed again (while the
      // failed refresh is still in flight, concurrent callers share it).
      vi.setSystemTime(LATEST_BLOCK_TTL_MS + RETRY_BACKOFF_MS - 1);
      expect(await governor.getCurrentBlockNumber()).toBe(123);
      expect(rpcCalls()).toBe(2);

      vi.setSystemTime(LATEST_BLOCK_TTL_MS + RETRY_BACKOFF_MS);
      await vi.waitFor(async () => {
        expect(await governor.getCurrentBlockNumber()).toBe(123);
        expect(rpcCalls()).toBe(3);
      });
    });

    it("should reject when there is no cached block and the RPC fails", async () => {
      const { governor } = createGovernor([new Error("rpc down")]);

      await expect(governor.getCurrentBlockNumber()).rejects.toThrow(
        "rpc down",
      );
    });
  });

  it("should dedupe concurrent timelock delay fetches", async () => {
    const client = createPublicClient({
      chain: mainnet,
      transport: custom({ request: async () => null }),
    });
    const governor = new TestGovernor(client);

    const delays = await Promise.all([
      governor.getTimelockDelay(),
      governor.getTimelockDelay(),
      governor.getTimelockDelay(),
    ]);

    expect(delays).toEqual([0n, 0n, 0n]);
    expect(governor.timelockDelayFetches).toBe(1);
  });
});
