import {
  Account,
  Address,
  Chain,
  Client as vClient,
  Transport,
} from "viem";
import { readContract } from "viem/actions";

import { DAOClient } from "@/clients";
import { GovernorAbi } from "./abi/governor";
import { GovernorBase } from "../governor.base";

export class Client<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
>
  extends GovernorBase
  implements DAOClient
{
  private abi: typeof GovernorAbi;
  private address: Address;

  constructor(client: vClient<TTransport, TChain, TAccount>, address: Address) {
    super(client);
    this.address = address;
    this.abi = GovernorAbi;
  }

  getDaoId(): string {
    return "NOUNS";
  }

  async getQuorum(): Promise<bigint> {
    const lastProposalId = await readContract(this.client, {
      abi: this.abi,
      address: this.address,
      functionName: "proposalCount",
    });

    return await readContract(this.client, {
      abi: this.abi,
      address: this.address,
      functionName: "quorumVotes",
      args: [lastProposalId],
    });
  }

  async getProposalThreshold(): Promise<bigint> {
    return readContract(this.client, {
      abi: this.abi,
      address: this.address,
      functionName: "proposalThreshold",
    });
  }

  async getVotingDelay(): Promise<bigint> {
    return readContract(this.client, {
      abi: this.abi,
      address: this.address,
      functionName: "votingDelay",
    });
  }

  async getVotingPeriod(): Promise<bigint> {
    return readContract(this.client, {
      abi: this.abi,
      address: this.address,
      functionName: "votingPeriod",
    });
  }

  async getTimelockDelay(): Promise<bigint> {
    const timelockAddress = await readContract(this.client, {
      abi: this.abi,
      address: this.address,
      functionName: "timelock",
    });
    return readContract(this.client, {
      abi: [
        {
          inputs: [],
          name: "delay",
          outputs: [
            {
              internalType: "uint256",
              name: "",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
        },
      ],
      address: timelockAddress,
      functionName: "delay",
    });
  }

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes + votes.abstainVotes;
  }
}
