import { Account, Address, Chain, Client, parseEther, Transport } from "viem";

import { DAOClient } from "@/clients";
import { ProposalStatus } from "@/lib/constants";

import { GovernorBase } from "../governor.base";

import { AzoriusABI } from "./abi/governor";

// Azorius on-chain constants (hardcoded to avoid RPC calls)
const EXECUTION_PERIOD_BLOCKS = 21600; // ~3 days at 12s/block
const TIMELOCK_PERIOD_BLOCKS = 0; // No timelock on Shutter

export class SHUClient<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
>
  extends GovernorBase
  implements DAOClient
{
  protected address: Address;
  protected abi: typeof AzoriusABI;
  private votingStrategyAddress: Address;

  constructor(
    client: Client<TTransport, TChain, TAccount>,
    governorAddress: Address,
    votingStrategyAddress: Address,
  ) {
    super(client);
    this.address = governorAddress;
    this.votingStrategyAddress = votingStrategyAddress;
    this.abi = AzoriusABI;
  }

  getDaoId(): string {
    return "SHU";
  }

  async getQuorum(_proposalId: string | null): Promise<bigint> {
    // Hardcoded: quorumNumerator is 30M on LinearVotingStrategy.
    // Avoids per-proposal RPC calls. If governance updates this, change here.
    return parseEther("30000000");
  }

  async getProposalThreshold(): Promise<bigint> {
    // Hardcoded: requiredProposerWeight on LinearVotingStrategy is 1 SHU.
    return parseEther("1");
  }

  async getVotingDelay(): Promise<bigint> {
    // Azorius has no voting delay — proposals become active immediately on submission
    return 0n;
  }

  async getVotingPeriod(): Promise<bigint> {
    // Hardcoded: 21600 blocks (~3 days at 12s/block)
    return 21600n;
  }

  async getTimelockDelay(): Promise<bigint> {
    // Hardcoded: Shutter has no timelock period
    return BigInt(TIMELOCK_PERIOD_BLOCKS);
  }

  /**
   * Azorius proposal status computation.
   *
   * Base class computes: PENDING, ACTIVE, NO_QUORUM, DEFEATED, SUCCEEDED.
   * This override adds EXPIRED: proposals that passed but weren't executed
   * within the execution period (endBlock + timelockPeriod + executionPeriod).
   *
   * Note: EXPIRED and NO_QUORUM are computed statuses never persisted in DB.
   * The proposals query prepareStatusForDatabase maps ACTIVE/DEFEATED/SUCCEEDED
   * to PENDING for DB filtering, so EXPIRED queries filter as ACTIVE (which is
   * the stored status for expired proposals).
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
    currentBlock: number,
    currentTimestamp: number,
  ): Promise<string> {
    const status = await super.getProposalStatus(
      proposal,
      currentBlock,
      currentTimestamp,
    );

    // If base returns SUCCEEDED, check if the execution window has expired
    if (status === ProposalStatus.SUCCEEDED) {
      const expirationBlock =
        proposal.endBlock + TIMELOCK_PERIOD_BLOCKS + EXECUTION_PERIOD_BLOCKS;

      if (currentBlock >= expirationBlock) {
        return ProposalStatus.EXPIRED;
      }
    }

    return status;
  }

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes + votes.abstainVotes;
  }
}
