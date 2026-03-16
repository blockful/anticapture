import { Account, Address, Chain, Client, parseEther, Transport } from "viem";
import { readContract } from "viem/actions";

import { DAOClient } from "@/clients";
import { ProposalStatus } from "@/lib/constants";

import { GovernorBase } from "../governor.base";

import { AzoriusABI } from "./abi/governor";

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
    // Hardcoded: quorumNumerator is 30M on LinearVotingStrategy (30% of 100M basis).
    // Avoids per-proposal RPC calls. If governance updates this, change here.
    return parseEther("30000000");
  }

  async getProposalThreshold(): Promise<bigint> {
    // Hardcoded: requiredProposerWeight on LinearVotingStrategy is 1 SHU.
    // No DB column exists for this; all other DAOs read it via RPC.
    // Hardcoding avoids an RPC call for a value that rarely changes.
    return parseEther("1");
  }

  async getVotingDelay(): Promise<bigint> {
    // Azorius has no voting delay — proposals become active immediately on submission
    return 0n;
  }

  async getVotingPeriod(): Promise<bigint> {
    return BigInt(
      await readContract(this.client, {
        abi: [
          {
            inputs: [],
            name: "votingPeriod",
            outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        address: this.votingStrategyAddress,
        functionName: "votingPeriod",
      }),
    );
  }

  async getTimelockDelay(): Promise<bigint> {
    return BigInt(
      await readContract(this.client, {
        abi: [
          {
            inputs: [],
            name: "timelockPeriod",
            outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        address: this.address,
        functionName: "timelockPeriod",
      }),
    );
  }

  /**
   * Azorius proposals expire if not executed within the execution period
   * after the timelock. Override base class to compute EXPIRED status.
   *
   * Lifecycle: ACTIVE → SUCCEEDED → (timelock) → EXECUTABLE → EXPIRED
   * Since timelockPeriod=0 on Shutter, it goes directly to EXECUTABLE.
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
    // Use base class for all standard states first
    const status = await super.getProposalStatus(
      proposal,
      currentBlock,
      currentTimestamp,
    );

    // If base class returns SUCCEEDED, check if the execution window has expired
    if (status === ProposalStatus.SUCCEEDED) {
      const timelockDelay = await this.getTimelockDelay();
      const executionPeriod = await this.getExecutionPeriod();

      const expirationBlock =
        proposal.endBlock + Number(timelockDelay) + Number(executionPeriod);

      if (currentBlock >= expirationBlock) {
        return ProposalStatus.EXPIRED;
      }
    }

    return status;
  }

  private async getExecutionPeriod(): Promise<bigint> {
    if (!this.cache.executionPeriod) {
      this.cache.executionPeriod = BigInt(
        await readContract(this.client, {
          abi: [
            {
              inputs: [],
              name: "executionPeriod",
              outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
              stateMutability: "view",
              type: "function",
            },
          ],
          address: this.address,
          functionName: "executionPeriod",
        }),
      );
    }
    return this.cache.executionPeriod;
  }

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes + votes.abstainVotes;
  }
}
