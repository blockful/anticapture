import { createPublicClient, custom, zeroAddress } from "viem";
import { mainnet } from "viem/chains";
import { describe, expect, it } from "vitest";

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
