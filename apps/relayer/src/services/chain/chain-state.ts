import { Address } from "viem";

import { governorAbi } from "@/abi/governor";
import { erc20VotesAbi } from "@/abi/token";
import type { ChainReader } from "./chain-reader";

export interface IChainStateService {
  getVotingPower(address: Address): Promise<bigint>;
  getTokenBalance(address: Address): Promise<bigint>;
  getGovernorName(): Promise<string>;
  getTokenName(): Promise<string>;
}

export class ChainStateService implements IChainStateService {
  constructor(
    private client: ChainReader,
    private governorAddress: Address,
    private tokenAddress: Address,
  ) {}

  async getVotingPower(address: Address): Promise<bigint> {
    return this.client.readContract({
      address: this.tokenAddress,
      abi: erc20VotesAbi,
      functionName: "getVotes",
      args: [address],
    });
  }

  async getTokenBalance(address: Address): Promise<bigint> {
    return this.client.readContract({
      address: this.tokenAddress,
      abi: erc20VotesAbi,
      functionName: "balanceOf",
      args: [address],
    });
  }

  async getGovernorName(): Promise<string> {
    return this.client.readContract({
      address: this.governorAddress,
      abi: governorAbi,
      functionName: "name",
    });
  }

  async getTokenName(): Promise<string> {
    return this.client.readContract({
      address: this.tokenAddress,
      abi: erc20VotesAbi,
      functionName: "name",
    });
  }
}
