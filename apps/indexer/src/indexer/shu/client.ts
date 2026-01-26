import {
  Account,
  Address,
  Chain,
  Client,
  Transport,
  fromHex,
  toHex,
} from "viem";
import { readContract } from "viem/actions";
import { DAOClient } from "@/interfaces/client";
import { DaoIdEnum } from "@/lib/enums";
import { GovernorBase } from "../governor.base";
import { CONTRACT_ADDRESSES } from "@/lib/constants";

export class SHUClient<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
>
  extends GovernorBase
  implements DAOClient
{
  private governorAddress: Address;
  private votingStrategyAddress: Address;

  constructor(client: Client<TTransport, TChain, TAccount>, address: Address) {
    super(client);
    this.governorAddress = address;
    this.votingStrategyAddress =
      CONTRACT_ADDRESSES[DaoIdEnum.SHU].linearVotingStrategy.address;
  }

  getDaoId(): string {
    return "SHU";
  }

  async getQuorum(): Promise<bigint> {
    return 30n * 1000000n * 10n ** 18n;
  }

  async getProposalThreshold(): Promise<bigint> {
    return 0n;
    // readContract(this.client, {
    //   abi: [
    //     {
    //       anonymous: false,
    //       inputs: [
    //         {
    //           indexed: false,
    //           internalType: "uint256",
    //           name: "requiredProposerWeight",
    //           type: "uint256",
    //         },
    //       ],
    //       name: "RequiredProposerWeightUpdated",
    //       type: "event",
    //     },
    //   ],
    //   address: this.votingStrategyAddress,
    //   functionName: "requiredProposerWeight",
    // });
  }

  async getVotingDelay(): Promise<bigint> {
    return 0n;
  }

  async getVotingPeriod(): Promise<bigint> {
    return BigInt(
      await readContract(this.client, {
        abi: [
          {
            inputs: [],
            name: "votingPeriod",
            outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        address: this.votingStrategyAddress,
        functionName: "votingPeriod",
      }),
    );
  }

  async getTimelockDelay(): Promise<bigint> {
    return BigInt(
      await readContract(this.client, {
        abi: [
          {
            inputs: [],
            name: "timelockPeriod",
            outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
            stateMutability: "view",
            type: "function",
          },
        ],
        address: this.governorAddress,
        functionName: "timelockPeriod",
      }),
    );
  }

  async getBlockTime(blockNumber: number): Promise<number | null> {
    const block = await this.client.request({
      method: "eth_getBlockByNumber",
      params: [toHex(blockNumber), false],
    });
    return block?.timestamp ? fromHex(block.timestamp, "number") : null;
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
    return votes.forVotes + votes.abstainVotes + votes.abstainVotes;
  }
}
