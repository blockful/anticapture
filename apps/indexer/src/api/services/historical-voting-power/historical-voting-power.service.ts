import { Address, createPublicClient, http, PublicClient, encodeFunctionData } from "viem";
import { readContract } from "viem/actions";

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

// Multicall3 contract address (deployed after governance setup)
const MULTICALL3_ADDRESS = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0" as Address;

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
      // Use Multicall3 for blocks 19+ (after Multicall3 deployment), individual calls for earlier blocks
      if (blockNumber >= 19) {
        return await this.getVotingPowerWithMulticall(addresses, blockNumber, tokenAddress);
      } else {
        return await this.getVotingPowerIndividually(addresses, blockNumber, tokenAddress);
      }
    } catch (error) {
      console.error("Error fetching historical voting power:", error);
      // Fallback to individual calls if multicall fails
      console.log("Falling back to individual calls...");
      return await this.getVotingPowerIndividually(addresses, blockNumber, tokenAddress);
    }
  }

  /**
   * Get voting power using Multicall3 for efficient batch processing
   */
  private async getVotingPowerWithMulticall(
    addresses: Address[],
    blockNumber: number,
    tokenAddress: Address
  ): Promise<HistoricalVotingPower[]> {
    // Prepare multicall data
    const calls = addresses.map((address) => {
      const calldata = encodeFunctionData({
        abi: [
          {
            inputs: [{ name: "account", type: "address" }],
            name: "getVotes",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ] as const,
        functionName: "getVotes",
        args: [address],
      });

      return {
        target: tokenAddress,
        callData: calldata,
      };
    });

    // Call Multicall3.aggregate
    const result = await readContract(this.client, {
      address: MULTICALL3_ADDRESS,
      abi: [
        {
          inputs: [
            {
              components: [
                { name: "target", type: "address" },
                { name: "callData", type: "bytes" },
              ],
              name: "calls",
              type: "tuple[]",
            },
          ],
          name: "aggregate",
          outputs: [
            { name: "blockNumber", type: "uint256" },
            { name: "returnData", type: "bytes[]" },
          ],
          stateMutability: "payable",
          type: "function",
        },
      ] as const,
      functionName: "aggregate",
      args: [calls],
      blockNumber: BigInt(blockNumber),
    });

    const [, returnData] = result;

    // Decode the results
    return addresses.map((address, index) => {
      const data = returnData[index];
      // Decode uint256 from bytes
      const votingPower = data && data.length >= 66 ? BigInt(data) : 0n;
      
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
    tokenAddress: Address
  ): Promise<HistoricalVotingPower[]> {
    const votingPowerPromises = addresses.map((address) =>
      readContract(this.client, {
        address: tokenAddress,
        abi: [
          {
            inputs: [{ name: "account", type: "address" }],
            name: "getVotes",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ] as const,
        functionName: "getVotes",
        args: [address],
        blockNumber: BigInt(blockNumber),
      }).catch((error) => {
        console.error(`Error fetching voting power for ${address}:`, error);
        return 0n; // Return 0 if individual call fails
      })
    );

    const votingPowers = await Promise.all(votingPowerPromises);

    // Transform results into HistoricalVotingPower objects
    return addresses.map((address, index) => ({
      address: address!,
      votingPower: votingPowers[index] || 0n,
      blockNumber,
      tokenAddress,
    }));
  }

  /**
   * Maps DAO ID to corresponding token contract address
   */
  private getTokenAddress(daoId: DaoIdEnum): Address | null {
    const { NETWORK: network } = env;
    const contractInfo = CONTRACT_ADDRESSES[network]?.[daoId];
    return contractInfo?.token?.address || null;
  }

  /**
   * Validate the historical voting power request
   * @param request - The request to validate
   */
  private validateRequest(request: HistoricalVotingPowerRequest): void {
    if (!request.addresses || request.addresses.length === 0) {
      throw new Error("Addresses array cannot be empty");
    }

    if (request.addresses.length > 100) {
      throw new Error("Maximum 100 addresses allowed per request");
    }

    if (request.blockNumber <= 0) {
      throw new Error("Block number must be positive");
    }

    // Validate address format
    for (const address of request.addresses) {
      if (!this.isValidAddress(address)) {
        throw new Error(`Invalid address format: ${address}`);
      }
    }

    if (!Object.values(DaoIdEnum).includes(request.daoId)) {
      throw new Error(`Invalid DAO ID: ${request.daoId}`);
    }
  }

  /**
   * Get token contract for a specific DAO (used by controller for metadata)
   */
  public getTokenContract(daoId: DaoIdEnum) {
    const { NETWORK: network } = env;
    const contractInfo = CONTRACT_ADDRESSES[network]?.[daoId];
    
    if (!contractInfo?.token?.address) {
      throw new Error(`Token contract not found for DAO: ${daoId}`);
    }
    
    return contractInfo.token;
  }

  /**
   * Validates Ethereum address format
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }

  /**
   * Get current block number for validation
   */
  async getCurrentBlockNumber(): Promise<number> {
    const blockNumber = await this.client.getBlockNumber();
    return Number(blockNumber);
  }
} 