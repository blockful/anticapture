import { Abi, Account, Address, Chain, Client, Transport } from "viem";

import { DAOClient } from "@/clients";

import { GovernorBase } from "../governor.base";

export class GNOClient<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
>
  extends GovernorBase
  implements DAOClient
{
  protected abi: Abi = [];
  protected address: Address;

  constructor(client: Client<TTransport, TChain, TAccount>, address: Address) {
    super(client);
    this.address = address;
  }

  getDaoId(): string {
    return "GNO";
  }

  async getQuorum(): Promise<bigint> {
    return 0n;
  }

  async getTimelockDelay(): Promise<bigint> {
    return 0n;
  }

  alreadySupportCalldataReview(): boolean {
    return false;
  }

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes + votes.abstainVotes;
  }
}
