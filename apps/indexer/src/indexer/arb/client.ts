import { Account, Address, Chain, Client, Transport } from "viem";
import { getBlockNumber, readContract } from "viem/actions";

import { Governor } from "@/interfaces/governor";
import { GovernorAbi } from "./abi";

export class ARBClient<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
> implements Governor
{
  private client: Client<TTransport, TChain, TAccount>;
  private readonly abi = GovernorAbi;
  private address: Address;

  constructor(client: Client<TTransport, TChain, TAccount>, address: Address) {
    this.client = client;
    this.address = address;
  }

  async getQuorum(): Promise<bigint> {
    const blockNumber = await getBlockNumber(this.client);
    const targetBlock = blockNumber - 10n;
    return readContract(this.client, {
      abi: this.abi,
      address: this.address,
      functionName: "quorum",
      args: [targetBlock < 0n ? 0n : targetBlock],
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
          constant: true,
          inputs: [],
          outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
          payable: false,
          stateMutability: "view",
          type: "function",
          name: "getMinDelay",
        },
      ],
      address: timelockAddress,
      functionName: "getMinDelay",
    });
  }
}
