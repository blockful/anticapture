import { Account, Address, Chain, Client, Transport } from "viem";
import { readContract } from "viem/actions";

import { DAOClient } from "@/clients";

import { GovernorBase } from "../governor.base";

import { GovernorAbi } from "./abi";

export class OPClient<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
>
  extends GovernorBase
  implements DAOClient
{
  protected abi: typeof GovernorAbi;
  protected address: Address;

  constructor(client: Client<TTransport, TChain, TAccount>, address: Address) {
    super(client);
    this.address = address;
    this.abi = GovernorAbi;
  }

  getDaoId(): string {
    return "OP";
  }

  async getQuorum(proposalId: string | null): Promise<bigint> {
    if (!proposalId) return 0n;
    return readContract(this.client, {
      abi: this.abi,
      address: this.address,
      functionName: "quorum",
      args: [BigInt(proposalId)],
    });
  }

  async getTimelockDelay(): Promise<bigint> {
    return 0n;
  }

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes + votes.againstVotes + votes.abstainVotes;
  }
}
