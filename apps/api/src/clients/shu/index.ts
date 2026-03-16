import { Account, Address, Chain, Client, parseEther, Transport } from "viem";
import { readContract } from "viem/actions";

import { DAOClient } from "@/clients";

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

  async getQuorum(proposalId: string | null): Promise<bigint> {
    if (!proposalId) return 0n;

    return BigInt(
      await readContract(this.client, {
        abi: [
          {
            inputs: [
              { internalType: "uint32", name: "_proposalId", type: "uint32" },
            ],
            name: "quorumVotes",
            outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        address: this.votingStrategyAddress,
        functionName: "quorumVotes",
        args: [Number(proposalId)],
      }),
    );
  }

  async getProposalThreshold(): Promise<bigint> {
    // Hardcoded: requiredProposerWeight on LinearVotingStrategy is 1 SHU.
    // No DB column exists for this; all other DAOs read it via RPC.
    // Hardcoding avoids an RPC call for a value that rarely changes.
    return parseEther("1");
  }

  async getVotingDelay(): Promise<bigint> {
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

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes + votes.abstainVotes;
  }
}
