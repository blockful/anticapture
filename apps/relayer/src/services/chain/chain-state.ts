import { Address } from "viem";

import { governorAbi, ProposalState } from "@/abi/governor";
import { erc20VotesAbi } from "@/abi/token";
import type { ChainReader } from "./chain-reader";

export interface IChainStateService {
  getVotingPower(address: Address): Promise<bigint>;
  getTokenBalance(address: Address): Promise<bigint>;
  getProposalState(proposalId: bigint): Promise<ProposalState>;
  hasVoted(proposalId: bigint, voter: Address): Promise<boolean>;
  getDelegationNonce(address: Address): Promise<bigint>;
  getCurrentDelegate(address: Address): Promise<Address>;
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

  async getProposalState(proposalId: bigint): Promise<ProposalState> {
    const state = await this.client.readContract({
      address: this.governorAddress,
      abi: governorAbi,
      functionName: "state",
      args: [proposalId],
    });
    return state as ProposalState;
  }

  async hasVoted(proposalId: bigint, voter: Address): Promise<boolean> {
    return this.client.readContract({
      address: this.governorAddress,
      abi: governorAbi,
      functionName: "hasVoted",
      args: [proposalId, voter],
    });
  }

  async getDelegationNonce(address: Address): Promise<bigint> {
    return this.client.readContract({
      address: this.tokenAddress,
      abi: erc20VotesAbi,
      functionName: "nonces",
      args: [address],
    });
  }

  async getCurrentDelegate(address: Address): Promise<Address> {
    return this.client.readContract({
      address: this.tokenAddress,
      abi: erc20VotesAbi,
      functionName: "delegates",
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
