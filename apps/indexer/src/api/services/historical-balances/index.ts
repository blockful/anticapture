import { Address, createPublicClient, http, PublicClient } from "viem";

import { getChain } from "@/lib/utils";
import { env } from "@/env";
import { DBHistoricalBalance } from "@/api/mappers";

interface AccountBalanceRepository {
  getHistoricalBalances(
    addresses: Address[],
    startTimestamp: number,
  ): Promise<DBHistoricalBalance[]>;
}

export class HistoricalBalancesService {
  private client: PublicClient;

  constructor(private readonly repository: AccountBalanceRepository) {
    const { CHAIN_ID: chainId, RPC_URL: rpcUrl } = env;
    const chain = getChain(chainId);

    if (!chain) {
      throw new Error(`Chain with ID ${chainId} not found`);
    }

    this.client = createPublicClient({
      chain,
      transport: http(rpcUrl),
    });
  }

  /**
   * Fetches historical balances for multiple addresses at a specific time period
   */
  async getHistoricalBalances(
    addresses: Address[],
    startTimestamp: number,
  ): Promise<DBHistoricalBalance[]> {
    return await this.repository.getHistoricalBalances(
      addresses,
      startTimestamp,
    );
  }

  /**
   * Get current block number
   * @returns The current block number
   */
  async getCurrentBlockNumber(): Promise<number> {
    const blockNumber = await this.client.getBlockNumber();
    return Number(blockNumber);
  }
}
