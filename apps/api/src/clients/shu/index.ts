import { Account, Address, Chain, Client, parseEther, Transport } from "viem";

import { DAOClient } from "@/clients";
import { ProposalStatus } from "@/lib/constants";

import { GovernorBase } from "../governor.base";

import { AzoriusABI } from "./abi/governor";

// Azorius on-chain constants (hardcoded to avoid RPC calls)
// Source: LinearVotingStrategy contract (0x4b29d8B250B8b442ECfCd3a4e3D91933d2db720F)
const VOTING_PERIOD_BLOCKS = 21600; // votingPeriod() — ~3 days at 12s/block
const EXECUTION_PERIOD_BLOCKS = 21600; // Azorius.executionPeriod() — ~3 days at 12s/block
const TIMELOCK_PERIOD_BLOCKS = 0; // Azorius.timelockPeriod() — no timelock on Shutter

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
    return BigInt(VOTING_PERIOD_BLOCKS);
  }

  async getTimelockDelay(): Promise<bigint> {
    // Hardcoded: Shutter has no timelock period
    return BigInt(TIMELOCK_PERIOD_BLOCKS);
  }

  /**
   * Azorius proposal status computation.
   *
   * Lifecycle:
   *   ACTIVE → DEFEATED (forVotes <= againstVotes and quorum met)
   *   ACTIVE → NO_QUORUM (quorum not met)
   *   ACTIVE → SUCCEEDED (forVotes > againstVotes and quorum met)
   *   SUCCEEDED → EXPIRED (execution window passed: endBlock + timelockPeriod + executionPeriod)
   *   SUCCEEDED → EXECUTED (ProposalExecuted event, persisted by indexer)
   *
   * DEFEATED, NO_QUORUM, SUCCEEDED, and EXPIRED are computed at read-time
   * by the base class + this override. They are never persisted in DB.
   * prepareStatusForDatabase maps them to PENDING/ACTIVE for DB filtering.
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
