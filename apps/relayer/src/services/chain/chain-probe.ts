import type { Address, PublicActions } from "viem";

/**
 * Domain-level view of the chain reads the status check makes, so the
 * status service (and its tests) never deal with viem generics.
 */
export interface ChainProbe {
  /** Chain id the RPC reports through eth_chainId. */
  chainId(): Promise<number>;
  /** Timestamp of the latest block, in unix seconds. */
  latestBlockTimestamp(): Promise<bigint>;
  balance(address: Address): Promise<bigint>;
  /**
   * Transactions sent from the address: mined ones only at "latest", plus
   * the ones the node still holds in its mempool at "pending".
   */
  nonce(address: Address, blockTag: "latest" | "pending"): Promise<number>;
}

/** The viem actions the probe needs. A real PublicClient satisfies this. */
export type ChainProbeReader = Pick<
  PublicActions,
  "getChainId" | "getBlock" | "getBalance" | "getTransactionCount"
>;

export class ViemChainProbe implements ChainProbe {
  constructor(private client: ChainProbeReader) {}

  async chainId(): Promise<number> {
    return this.client.getChainId();
  }

  async latestBlockTimestamp(): Promise<bigint> {
    const { timestamp } = await this.client.getBlock();
    return timestamp;
  }

  async balance(address: Address): Promise<bigint> {
    return this.client.getBalance({ address });
  }

  async nonce(
    address: Address,
    blockTag: "latest" | "pending",
  ): Promise<number> {
    return this.client.getTransactionCount({ address, blockTag });
  }
}
