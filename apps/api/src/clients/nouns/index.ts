import { Account, Address, Chain, Client as vClient, Transport } from "viem";

import { DAOClient } from "@/clients";

import { GovernorBase } from "../governor.base";

import { GovernorAbi } from "./abi/governor";

export class Client<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
>
  extends GovernorBase
  implements DAOClient
{
  protected abi: typeof GovernorAbi;
  protected address: Address;

  constructor(client: vClient<TTransport, TChain, TAccount>, address: Address) {
    super(client, 5); // 5 minutes of cache for quorum
    this.address = address;
    this.abi = GovernorAbi;
  }

  getDaoId(): string {
    return "NOUNS";
  }

  async getQuorum(): Promise<bigint> {
    return this.getCachedQuorum(async () => {
      const lastProposalId = await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "proposalCount",
      });

      return this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "quorumVotes",
        args: [lastProposalId],
      });
    });
  }

  async getTimelockDelay(): Promise<bigint> {
    if (!this.cache.timelockDelay) {
      const timelockAddress = await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "timelock",
      });
      this.cache.timelockDelay = await this.readContract({
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
    return this.cache.timelockDelay;
  }

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes + votes.abstainVotes;
  }
}
