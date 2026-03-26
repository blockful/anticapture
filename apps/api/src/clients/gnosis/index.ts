import {
  Abi,
  Account,
  Address,
  Chain,
  Client,
  Transport,
  zeroAddress,
} from "viem";

import { DAOClient } from "@/clients";

import { GovernorBase } from "../governor.base";

export class GnosisClient<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
>
  extends GovernorBase
  implements DAOClient
{
  protected address: Address;
  protected abi: Abi;

  constructor(client: Client<TTransport, TChain, TAccount>) {
    super(client);
    this.address = zeroAddress;
    this.abi = [];
  }

  getDaoId(): string {
    return "GNO";
  }

  async getProposalThreshold(): Promise<bigint> {
    return 0n;
  }

  async getQuorum(): Promise<bigint> {
    return 0n;
  }

  async getTimelockDelay(): Promise<bigint> {
    return 0n;
  }

  async getVotingDelay(): Promise<bigint> {
    return 0n;
  }

  async getVotingPeriod(): Promise<bigint> {
    return 0n;
  }

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes;
  }

  override supportOffchainData(): boolean {
    return true;
  }
}
