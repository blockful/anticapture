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

  getTimelockDelay(): Promise<bigint> {
    return Promise.resolve(0n);
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
});
