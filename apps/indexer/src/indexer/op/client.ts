import { Account, Address, Chain, Client, Transport } from "viem";
import { readContract } from "viem/actions";

import { Governor } from "@/interfaces/governor";
import { GovernorAbi } from "./abi";

export class OPGovernor<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
> implements Governor
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
}
