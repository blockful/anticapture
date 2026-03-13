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

  async getQuorum(_: string | null): Promise<bigint> {
    return parseEther("30000000");
  }

  async getProposalThreshold(): Promise<bigint> {
    return 0n;
    // readContract(this.client, {
    //   abi: [
    //     {
    //       anonymous: false,
    //       inputs: [
    //         {
    //           indexed: false,
    //           internalType: "uint256",
    //           name: "requiredProposerWeight",
    //           type: "uint256",
    //         },
    //       ],
    //       name: "RequiredProposerWeightUpdated",
    //       type: "event",
    //     },
    //   ],
    //   address: this.votingStrategyAddress,
    //   functionName: "requiredProposerWeight",
    // });
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
    return votes.forVotes + votes.abstainVotes + votes.abstainVotes;
  }
}
