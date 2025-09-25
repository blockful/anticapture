import { Account, Address, Chain, Client, Transport } from "viem";
import { getBlockNumber, readContract } from "viem/actions";

import { GovernorBase } from "@/indexer/governor.base";
import { DAOClient } from "@/interfaces/client";
import { GovernorAbi } from "./abi";

export class ARBClient<
    TTransport extends Transport = Transport,
    TChain extends Chain = Chain,
    TAccount extends Account | undefined = Account | undefined,
  >
  extends GovernorBase
  implements DAOClient
{
  private readonly abi = GovernorAbi;
  private address: Address;

  constructor(client: Client<TTransport, TChain, TAccount>, address: Address) {
    super(client);
    this.address = address;
  }

  async getQuorum(_: string | null): Promise<bigint> {
    const blockNumber = await getBlockNumber(this.client);
    return readContract(this.client, {
      abi: this.abi,
      address: this.address,
      functionName: "quorum",
      args: [blockNumber],
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

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes + votes.againstVotes;
  }
}
