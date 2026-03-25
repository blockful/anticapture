import { Account, Address, Chain, Client, Transport } from "viem";

import { DAOClient } from "@/clients";
import { ProposalStatus } from "@/lib/constants";

import { GovernorBase } from "../governor.base";

import { TORNGovernorAbi } from "./abi";

const BLOCK_TIME = 12;

export class TORNClient<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
>
  extends GovernorBase
  implements DAOClient
{
  protected address: Address;
  protected abi: typeof TORNGovernorAbi;

  constructor(client: Client<TTransport, TChain, TAccount>, address: Address) {
    super(client);
    this.address = address;
    this.abi = TORNGovernorAbi;
  }

  getDaoId(): string {
    return "TORN";
  }

  async getQuorum(_proposalId: string | null): Promise<bigint> {
    return this.getCachedQuorum(async () => {
      return this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "QUORUM_VOTES",
      });
    });
  }

  async getVotingDelay(): Promise<bigint> {
    if (!this.cache.votingDelay) {
      this.cache.votingDelay = (await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "VOTING_DELAY",
      })) as bigint;
    }
    return this.cache.votingDelay!;
  }

  async getVotingPeriod(): Promise<bigint> {
    if (!this.cache.votingPeriod) {
      this.cache.votingPeriod = (await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "VOTING_PERIOD",
      })) as bigint;
    }
    return this.cache.votingPeriod!;
  }

  async getProposalThreshold(): Promise<bigint> {
    if (!this.cache.proposalThreshold) {
      this.cache.proposalThreshold = (await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "PROPOSAL_THRESHOLD",
      })) as bigint;
    }
    return this.cache.proposalThreshold!;
  }

  async getTimelockDelay(): Promise<bigint> {
    if (!this.cache.timelockDelay) {
      this.cache.timelockDelay = (await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "EXECUTION_DELAY",
      })) as bigint;
    }
    return this.cache.timelockDelay!;
  }

  private async getExecutionExpiration(): Promise<bigint> {
    if (!this.cache.executionPeriod) {
      this.cache.executionPeriod = (await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "EXECUTION_EXPIRATION",
      })) as bigint;
    }
    return this.cache.executionPeriod!;
  }

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes;
  }

  alreadySupportCalldataReview(): boolean {
    return false;
  }

  /**
   * Tornado Cash proposal status — timestamp-based, not block-based.
   *
   * The governor uses seconds for all timing parameters (VOTING_DELAY,
   * VOTING_PERIOD, EXECUTION_DELAY, EXECUTION_EXPIRATION). We derive
   * startTime synthetically from endTimestamp and the block range.
   *
   * State machine:
   *   EXECUTED → finalized (persisted by indexer)
   *   now < startTime → PENDING
   *   now < endTimestamp → ACTIVE
   *   forVotes < quorum → NO_QUORUM
   *   forVotes <= againstVotes → DEFEATED
   *   now < endTimestamp + EXECUTION_DELAY → QUEUED
   *   now < endTimestamp + EXECUTION_DELAY + EXECUTION_EXPIRATION → PENDING_EXECUTION
   *   else → EXPIRED
   */
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
    _currentBlock: number,
    currentTimestamp: number,
  ): Promise<string> {
    // Already finalized via event
    if (proposal.status === ProposalStatus.EXECUTED) {
      return ProposalStatus.EXECUTED;
    }

    if (proposal.status === ProposalStatus.CANCELED) {
      return ProposalStatus.CANCELED;
    }

    const now = BigInt(currentTimestamp);
    const endTimestamp = proposal.endTimestamp;

    // Estimate startTime from endTimestamp and block range
    const votingDurationSeconds =
      BigInt(proposal.endBlock - proposal.startBlock) * BigInt(BLOCK_TIME);
    const startTime = endTimestamp - votingDurationSeconds;

    if (now < startTime) {
      return ProposalStatus.PENDING;
    }

    if (now < endTimestamp) {
      return ProposalStatus.ACTIVE;
    }

    // After voting period ends — check quorum and majority
    const quorum = await this.getQuorum(proposal.id);
    const proposalQuorum = this.calculateQuorum({
      forVotes: proposal.forVotes,
      againstVotes: proposal.againstVotes,
      abstainVotes: proposal.abstainVotes,
    });

    if (proposalQuorum < quorum) {
      return ProposalStatus.NO_QUORUM;
    }

    if (proposal.forVotes <= proposal.againstVotes) {
      return ProposalStatus.DEFEATED;
    }

    // Passed — check timelock windows
    const executionDelay = await this.getTimelockDelay();
    const executionExpiration = await this.getExecutionExpiration();

    if (now < endTimestamp + executionDelay) {
      return ProposalStatus.QUEUED;
    }

    if (now < endTimestamp + executionDelay + executionExpiration) {
      return ProposalStatus.PENDING_EXECUTION;
    }

    return ProposalStatus.EXPIRED;
  }
}
