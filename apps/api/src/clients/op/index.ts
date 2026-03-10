import { Account, Address, Chain, Client, Transport } from "viem";

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
    super(client, 5); // 5 minutes of cache for quorum
    this.address = address;
    this.abi = GovernorAbi;
  }

  getDaoId(): string {
    return "OP";
  }

  async getQuorum(proposalId: string | null): Promise<bigint> {
    if (!proposalId) return 0n;
    return this.getCachedQuorum(async () => {
      return this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "quorum",
        args: [BigInt(proposalId)],
      }) as Promise<bigint>;
    }, `quorum:proposal:${proposalId}`);
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
