import {
  Abi,
  Account,
  Address,
  Chain,
  Client,
  ContractFunctionArgs,
  ContractFunctionName,
  fromHex,
  toHex,
  Transport,
} from "viem";
import { readContract } from "viem/actions";
import type {
  ReadContractParameters,
  ReadContractReturnType,
} from "viem/actions";

import { rpcRequestTotal } from "@/metrics";

import { ProposalStatus } from "../lib/constants";

/**
 * Base implementation for EVM Compound-based governance contracts.
 * Provides common functionality for proposal status calculation
 * not handled by the indexing process.
 */

export abstract class GovernorBase<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
> {
  protected cache: {
    proposalThreshold?: bigint;
    votingDelay?: bigint;
    votingPeriod?: bigint;
    timelockDelay?: bigint;
    executionPeriod?: bigint;
  } = {};
  private readonly quorumCache = new Map<
    string,
    { value: bigint; expiresAt: number }
  >();
  private readonly quorumCacheTtlMs: number;

  protected abstract address: Address;
  protected abstract abi: Abi;

  constructor(
    protected client: Client<TTransport, TChain, TAccount>,
    quorumCacheTtlMinutes: number = Infinity,
  ) {
    this.quorumCacheTtlMs = Math.max(1, quorumCacheTtlMinutes) * 60 * 1000;
  }

  protected async getCachedQuorum(
    fetcher: () => Promise<bigint>,
    cacheKey: string = "quorum",
  ): Promise<bigint> {
    const now = Date.now();
    const cached = this.quorumCache.get(cacheKey);

    if (cached && cached.expiresAt > now) {
      return cached.value;
    }

    const quorum = await fetcher();
    this.quorumCache.set(cacheKey, {
      value: quorum,
      expiresAt: now + this.quorumCacheTtlMs,
    });

    return quorum;
  }

  async getProposalThreshold(): Promise<bigint> {
    if (!this.cache.proposalThreshold) {
      this.cache.proposalThreshold = (await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "proposalThreshold",
        args: [],
      })) as bigint;
    }
    return this.cache.proposalThreshold!;
  }

  async getVotingDelay(): Promise<bigint> {
    if (!this.cache.votingDelay) {
      this.cache.votingDelay = (await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "votingDelay",
        args: [],
      })) as bigint;
    }
    return this.cache.votingDelay!;
  }

  async getVotingPeriod(): Promise<bigint> {
    if (!this.cache.votingPeriod) {
      this.cache.votingPeriod = (await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "votingPeriod",
        args: [],
      })) as bigint;
    }
    return this.cache.votingPeriod!;
  }

  abstract calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint;

  abstract getQuorum(proposalId: string | null): Promise<bigint>;

  abstract getTimelockDelay(): Promise<bigint>;

  async getGracePeriod(): Promise<bigint | null> {
    return null;
  }

  async getProposalStatus(
    proposal: {
      id: string;
      status: string;
      startBlock: number;
      endBlock: number;
      forVotes: bigint;
      againstVotes: bigint;
      abstainVotes: bigint;
      endTimestamp: bigint;
    },
    currentBlock: number,
    currentTimestamp: number,
  ): Promise<string> {
    const timelockDelay = await this.getTimelockDelay();
    const gracePeriod = await this.getGracePeriod();

    if (
      proposal.status === ProposalStatus.QUEUED &&
      gracePeriod !== null &&
      currentTimestamp &&
      BigInt(currentTimestamp) >=
        proposal.endTimestamp + timelockDelay + gracePeriod
    ) {
      return ProposalStatus.EXPIRED;
    }

    if (
      proposal.status === ProposalStatus.QUEUED &&
      currentTimestamp &&
      BigInt(currentTimestamp) >= proposal.endTimestamp + timelockDelay
    ) {
      return ProposalStatus.PENDING_EXECUTION;
    }

    // Skip proposals already finalized via event
    if (
      [
        ProposalStatus.CANCELED,
        ProposalStatus.VETOED,
        ProposalStatus.QUEUED,
        ProposalStatus.EXECUTED,
      ].includes(proposal.status as ProposalStatus)
    ) {
      return proposal.status;
    }

    if (currentBlock < proposal.startBlock) {
      return ProposalStatus.PENDING;
    }

    if (
      currentBlock >= proposal.startBlock &&
      currentBlock < proposal.endBlock
    ) {
      return ProposalStatus.ACTIVE;
    }

    // After voting period ends
    if (currentBlock >= proposal.endBlock) {
      const proposalQuorum = this.calculateQuorum({
        forVotes: proposal.forVotes,
        againstVotes: proposal.againstVotes,
        abstainVotes: proposal.abstainVotes,
      });

      const quorum = await this.getQuorum(proposal.id);
      const hasQuorum = proposalQuorum >= quorum;
      if (!hasQuorum) return ProposalStatus.NO_QUORUM;

      const voteSum =
        proposal.forVotes + proposal.againstVotes + proposal.abstainVotes;

      const hasMajority = proposal.forVotes > proposal.againstVotes;
      if (voteSum > quorum && !hasMajority) return ProposalStatus.DEFEATED;

      return ProposalStatus.SUCCEEDED;
    }

    return proposal.status;
  }

  protected async readContract<
    const TAbi extends Abi,
    TFunctionName extends ContractFunctionName<TAbi, "pure" | "view">,
    TArgs extends ContractFunctionArgs<TAbi, "pure" | "view", TFunctionName>,
  >(
    params: ReadContractParameters<TAbi, TFunctionName, TArgs>,
  ): Promise<ReadContractReturnType<TAbi, TFunctionName, TArgs>> {
    rpcRequestTotal.add(1, { method: "eth_call" });
    return readContract(this.client, params);
  }

  protected async getBlockNumber(): Promise<bigint> {
    rpcRequestTotal.add(1, { method: "eth_blockNumber" });
    const result = await this.client.request({ method: "eth_blockNumber" });
    return BigInt(result);
  }

  alreadySupportCalldataReview(): boolean {
    return false;
  }

  supportOffchainData(): boolean {
    return false;
  }

  async getCurrentBlockNumber(): Promise<number> {
    rpcRequestTotal.add(1, { method: "eth_blockNumber" });
    const result = await this.client.request({
      method: "eth_blockNumber",
    });
    return fromHex(result, "number");
  }

  async getBlockTime(blockNumber: number): Promise<number | null> {
    rpcRequestTotal.add(1, { method: "eth_getBlockByNumber" });
    const block = await this.client.request({
      method: "eth_getBlockByNumber",
      params: [toHex(blockNumber), false],
    });
    return block?.timestamp ? fromHex(block.timestamp, "number") : null;
  }
}
