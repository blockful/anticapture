import {
  Address,
  createPublicClient,
  http,
  PublicClient,
  isAddress,
  parseAbi,
} from "viem";
import { readContract, multicall } from "viem/actions";

import { DaoIdEnum, DaysEnum } from "@/lib/enums";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { getChain } from "@/lib/utils";
import { calculateHistoricalBlockNumber } from "@/lib/blockTime";
import { env } from "@/env";

export interface HistoricalBalance {
  address: Address;
  balance: bigint;
  blockNumber: number;
  tokenAddress: Address;
}

export interface HistoricalBalancesRequest {
  addresses: Address[];
  daysInSeconds: DaysEnum;
  daoId: DaoIdEnum;
}

export class HistoricalBalancesService {
  private client: PublicClient;

  constructor() {
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
   * Uses Multicall3 for efficient batch queries when available (block 19+)
   * Falls back to individual calls for earlier blocks
   */
  async getHistoricalBalances({
    addresses,
    daysInSeconds,
    daoId,
  }: HistoricalBalancesRequest): Promise<HistoricalBalance[]> {
    const tokenAddress = CONTRACT_ADDRESSES[daoId].token.address;
    const currentBlockNumber = await this.getCurrentBlockNumber();
    const blockNumber = calculateHistoricalBlockNumber(
      daysInSeconds,
      currentBlockNumber,
      CONTRACT_ADDRESSES[daoId].blockTime,
    );
    try {
      return await this.getBalancesWithMulticall(
        addresses,
        blockNumber,
        tokenAddress,
      );
    } catch (error) {
      console.error("Error fetching historical balances:", error);
      // Fallback to individual calls if multicall fails
      return await this.getBalancesIndividually(
        addresses,
        blockNumber,
        tokenAddress,
      );
    }
  }

  /**
   * Get balances using Multicall3 for efficient batch processing
   */
  private async getBalancesWithMulticall(
    addresses: Address[],
    blockNumber: number,
    tokenAddress: Address,
  ): Promise<HistoricalBalance[]> {
    const results = await multicall(this.client, {
      contracts: addresses.map((address) => ({
        address: tokenAddress,
        abi: parseAbi([
          "function balanceOf(address account) external view returns (uint256)",
        ]),
        functionName: "balanceOf",
        args: [address],
      })),
      blockNumber: BigInt(blockNumber),
    });

    // Transform results into HistoricalBalance objects
    return addresses.map((address, index) => {
      const result = results[index];
      const balance = result?.result || 0n;

      return {
        address,
        balance,
        blockNumber,
        tokenAddress,
      };
    });
  }

  /**
   * Get balances using individual readContract calls
   */
  private async getBalancesIndividually(
    addresses: Address[],
    blockNumber: number,
    tokenAddress: Address,
  ): Promise<HistoricalBalance[]> {
    const balances = await Promise.allSettled(
      addresses.map((address) =>
        this.client.readContract({
          address: tokenAddress,
          abi: parseAbi([
            "function balanceOf(address account) external view returns (uint256)",
          ]),
          functionName: "balanceOf",
          args: [address],
          blockNumber: BigInt(blockNumber),
        }),
      ),
    );
    // Transform results into HistoricalBalance objects
    return addresses.map((address, index) => ({
      address,
      balance:
        balances[index]?.status === "fulfilled"
          ? (balances[index].value as bigint)
          : 0n,
      blockNumber,
      tokenAddress,
    }));
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
