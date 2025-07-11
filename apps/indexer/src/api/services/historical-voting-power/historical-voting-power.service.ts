import {
  Address,
  createPublicClient,
  http,
  PublicClient,
  parseAbi,
} from "viem";
import { multicall } from "viem/actions";

import { DaoIdEnum } from "@/lib/enums";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { getChain } from "@/lib/utils";
import { env } from "@/env";

export interface HistoricalVotingPower {
  address: Address;
  votingPower: bigint;
  blockNumber: number;
  tokenAddress: Address;
}

export interface HistoricalVotingPowerRequest {
  addresses: Address[];
  blockNumber: number;
  daoId: DaoIdEnum;
}

export class HistoricalVotingPowerService {
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
   * Fetches historical voting power for multiple addresses at a specific block
   * Uses Multicall3 for efficient batch queries when available (block 19+)
   * Falls back to individual calls for earlier blocks
   */
  async getHistoricalVotingPower({
    addresses,
    blockNumber,
    daoId,
  }: HistoricalVotingPowerRequest): Promise<HistoricalVotingPower[]> {
    const tokenAddress = this.getTokenAddress(daoId);

    if (!tokenAddress) {
      throw new Error(`Token address not found for DAO: ${daoId}`);
    }

    try {
      return await this.getVotingPowerWithMulticall(
        addresses,
        blockNumber,
        tokenAddress,
      );
    } catch (error) {
      console.error("Error fetching historical voting power:", error);
      // Fallback to individual calls if multicall fails
      return await this.getVotingPowerIndividually(
        addresses,
        blockNumber,
        tokenAddress,
      );
    }
  }

  /**
   * Get voting power using Multicall3 for efficient batch processing
   */
  private async getVotingPowerWithMulticall(
    addresses: Address[],
    blockNumber: number,
    tokenAddress: Address,
  ): Promise<HistoricalVotingPower[]> {
    const results = await multicall(this.client, {
      contracts: addresses.map((address) => ({
        address: tokenAddress,
        abi: parseAbi([
          "function getVotes(address account) external view returns (uint256)",
        ]),
        functionName: "getVotes",
        args: [address],
      })),
      blockNumber: BigInt(blockNumber),
    });

    // Transform results into HistoricalVotingPower objects
    return addresses.map((address, index) => {
      const result = results[index];
      const votingPower =
        result?.status === "success" ? (result.result ?? 0n) : 0n;

      return {
        address,
        votingPower,
        blockNumber,
        tokenAddress,
      };
    });
  }

  /**
   * Get voting power using individual readContract calls
   */
  private async getVotingPowerIndividually(
    addresses: Address[],
    blockNumber: number,
    tokenAddress: Address,
  ): Promise<HistoricalVotingPower[]> {
    const votingPowers = await Promise.allSettled(
      addresses.map((address) =>
        this.client.readContract({
          address: tokenAddress,
          abi: parseAbi([
            "function getVotes(address account) external view returns (uint256)",
          ]),
          functionName: "getVotes",
          args: [address],
          blockNumber: BigInt(blockNumber),
        }),
      ),
    );

    // Transform results into HistoricalVotingPower objects
    return addresses.map((address, index) => ({
      address,
      votingPower:
        votingPowers[index]?.status === "fulfilled"
          ? (votingPowers[index].value as bigint)
          : 0n,
      blockNumber,
      tokenAddress,
    }));
  }

  /**
   * Maps DAO ID to corresponding token contract address
   */
  private getTokenAddress(daoId: DaoIdEnum): Address | null {
    const contractInfo = CONTRACT_ADDRESSES[daoId];
    return contractInfo?.token?.address || null;
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
