import { Account, Address, Chain, Client, fromHex, Transport } from "viem";
import { getBlockNumber, readContract } from "viem/actions";

import { DAOClient } from "@/interfaces/client";
import { ENSGovernorAbi } from "./abi";
import { GovernorBase } from "../governor.base";

export class ENSClient<
    TTransport extends Transport = Transport,
    TChain extends Chain = Chain,
    TAccount extends Account | undefined = Account | undefined,
  >
  extends GovernorBase
  implements DAOClient
{
  private abi: typeof ENSGovernorAbi;
  private address: Address;

  constructor(client: Client<TTransport, TChain, TAccount>, address: Address) {
    super(client);
    this.address = address;
    this.abi = ENSGovernorAbi;
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

  async getCurrentBlockNumber(): Promise<number> {
    const result = await this.client.request({
      method: "eth_blockNumber",
    });
    return fromHex(result, "number");
  }

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes + votes.abstainVotes;
  }
}
