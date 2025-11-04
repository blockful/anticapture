import {
  Account,
  Address,
  Chain,
  Client,
  fromHex,
  toHex,
  Transport,
} from "viem";

import { DAOClient } from "@/interfaces/client";
import { GovernorBase } from "../governor.base";
import { COMPGovernorAbi } from "./abi";
import { getBlockNumber, readContract } from "viem/actions";

export class COMPClient<
    TTransport extends Transport = Transport,
    TChain extends Chain = Chain,
    TAccount extends Account | undefined = Account | undefined,
  >
  extends GovernorBase
  implements DAOClient
{
  private abi: typeof COMPGovernorAbi;
  private address: Address;

  constructor(client: Client<TTransport, TChain, TAccount>, address: Address) {
    super(client);
    this.address = address;
    this.abi = COMPGovernorAbi;
  }

  getDaoId(): string {
    return "COMP";
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

  async getCurrentBlockNumber(): Promise<number> {
    const result = await this.client.request({
      method: "eth_blockNumber",
    });
    return fromHex(result, "number");
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
    // https://www.tally.xyz/gov/compound
    return votes.forVotes;
  }
}
