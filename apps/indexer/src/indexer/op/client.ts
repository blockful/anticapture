import {
  Account,
  Address,
  Chain,
  Client,
  fromHex,
  toHex,
  Transport,
} from "viem";
import { readContract } from "viem/actions";

import { DAOClient } from "@/interfaces/client";
import { GovernorAbi } from "./abi";

export class OPClient<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
> implements DAOClient
{
  private client: Client<TTransport, TChain, TAccount>;
  private abi: typeof GovernorAbi;
  private address: Address;

  constructor(client: Client<TTransport, TChain, TAccount>, address: Address) {
    this.client = client;
    this.address = address;
    this.abi = GovernorAbi;
  }

  async getQuorum(): Promise<bigint> {
    return 0n; // TODO: fetch quorum from oracle
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
    return 0n;
  }

  async getBlockTime(blockNumber: number): Promise<number | null> {
    const block = await this.client.request({
      method: "eth_getBlockByNumber",
      params: [toHex(blockNumber), false],
    });
    return block?.timestamp ? fromHex(block.timestamp, "number") : null;
  }

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes + votes.againstVotes + votes.abstainVotes;
  }
}
