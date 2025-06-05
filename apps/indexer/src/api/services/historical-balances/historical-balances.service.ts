import {
  Address,
  createPublicClient,
  http,
  PublicClient,
  encodeFunctionData,
  isAddress,
  decodeAbiParameters,
  parseAbi,
} from "viem";
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
const MULTICALL3_ADDRESS =
  "0xA51c1fc2f0D1a1b8494Ed1FE312d7C3a78Ed91C0" as Address;

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

    const [, returnData] = result as [any, `0x${string}`[]];

    // Decode the results
    return addresses.map((address, index) => {
      const data = returnData[index];
      let balance = 0n;

      if (data && data !== "0x") {
        // Properly decode the uint256 return value
        [balance] = decodeAbiParameters([{ type: "uint256" }], data);
      }

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
          abi: parseAbi(["function balanceOf(address account) (uint256)"]),
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
   * Maps DAO ID to corresponding token contract address
   */
  private getTokenAddress(daoId: DaoIdEnum): Address | null {
    const { NETWORK: network } = env;
    const contractInfo = CONTRACT_ADDRESSES[network]?.[daoId];
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
