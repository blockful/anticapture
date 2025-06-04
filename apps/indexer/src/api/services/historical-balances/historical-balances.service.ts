import { Address, createPublicClient, http, PublicClient, encodeFunctionData } from "viem";
import { readContract } from "viem/actions";

import { DaoIdEnum } from "@/lib/enums";
import { CONTRACT_ADDRESSES } from "@/lib/constants";
import { getChain } from "@/lib/utils";
import { env } from "@/env";

export interface HistoricalBalance {
  address: Address;
  balance: bigint;
  blockNumber: number;
  tokenAddress: Address;
}

export interface HistoricalBalancesRequest {
  addresses: Address[];
  blockNumber: number;
  daoId: DaoIdEnum;
}

// Multicall3 contract address (deployed after governance setup)
const MULTICALL3_ADDRESS = "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0" as Address;

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
   * Fetches historical balances for multiple addresses at a specific block
   * Uses Multicall3 for efficient batch queries when available (block 19+)
   * Falls back to individual calls for earlier blocks
   */
  async getHistoricalBalances({
    addresses,
    blockNumber,
    daoId,
  }: HistoricalBalancesRequest): Promise<HistoricalBalance[]> {
    const tokenAddress = this.getTokenAddress(daoId);

    if (!tokenAddress) {
      throw new Error(`Token address not found for DAO: ${daoId}`);
    }

    try {
      // Use Multicall3 for blocks 19+ (after Multicall3 deployment), individual calls for earlier blocks
      if (blockNumber >= 19) {
        return await this.getBalancesWithMulticall(addresses, blockNumber, tokenAddress);
      } else {
        return await this.getBalancesIndividually(addresses, blockNumber, tokenAddress);
      }
    } catch (error) {
      console.error("Error fetching historical balances:", error);
      // Fallback to individual calls if multicall fails
      console.log("Falling back to individual calls...");
      return await this.getBalancesIndividually(addresses, blockNumber, tokenAddress);
    }
  }

  /**
   * Get balances using Multicall3 for efficient batch processing
   */
  private async getBalancesWithMulticall(
    addresses: Address[],
    blockNumber: number,
    tokenAddress: Address
  ): Promise<HistoricalBalance[]> {
    // Prepare multicall data
    const calls = addresses.map((address) => {
      const calldata = encodeFunctionData({
        abi: [
          {
            inputs: [{ name: "account", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ] as const,
        functionName: "balanceOf",
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
      const balance = data && data.length >= 66 ? BigInt(data) : 0n;
      
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
    tokenAddress: Address
  ): Promise<HistoricalBalance[]> {
    const balancePromises = addresses.map((address) =>
      readContract(this.client, {
        address: tokenAddress,
        abi: [
          {
            inputs: [{ name: "account", type: "address" }],
            name: "balanceOf",
            outputs: [{ name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ] as const,
        functionName: "balanceOf",
        args: [address],
        blockNumber: BigInt(blockNumber),
      }).catch((error) => {
        console.error(`Error fetching balance for ${address}:`, error);
        return 0n; // Return 0 if individual call fails
      })
    );

    const balances = await Promise.all(balancePromises);

    // Transform results into HistoricalBalance objects
    return addresses.map((address, index) => ({
      address: address!,
      balance: balances[index] || 0n,
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
   * Validate the historical balances request
   * @param request - The request to validate
   */
  private validateRequest(request: HistoricalBalancesRequest): void {
    const { addresses, blockNumber, daoId } = request;

    // Validate addresses array
    if (!Array.isArray(addresses) || addresses.length === 0) {
      throw new Error("Addresses array cannot be empty");
    }

    if (addresses.length > 100) {
      throw new Error("Maximum 100 addresses allowed per request");
    }

    // Validate block number
    if (!Number.isInteger(blockNumber) || blockNumber <= 0) {
      throw new Error("Block number must be a positive integer");
    }

    // Validate DAO ID
    if (!Object.values(DaoIdEnum).includes(daoId)) {
      throw new Error(`Invalid DAO ID: ${daoId}`);
    }

    // Validate that addresses are valid Ethereum addresses
    addresses.forEach((address, index) => {
      if (!this.isValidAddress(address)) {
        throw new Error(`Invalid address at index ${index}: ${address}`);
      }
    });
  }

  /**
   * Get token contract information for a specific DAO
   * @param daoId - The DAO identifier
   * @returns Token contract address and ABI
   */
  public getTokenContract(daoId: DaoIdEnum) {
    const { NETWORK: network } = env;
    const contractInfo = CONTRACT_ADDRESSES[network][daoId];

    if (!contractInfo?.token) {
      throw new Error(
        `Token contract not found for DAO: ${daoId} on network: ${network}`,
      );
    }

    return contractInfo.token;
  }

  /**
   * Validate Ethereum address format
   * @param address - The address to validate
   * @returns True if valid, false otherwise
   */
  private isValidAddress(address: string): boolean {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
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
