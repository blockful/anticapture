import {
  Account,
  Address,
  Chain,
  Client,
  fromHex,
  parseEther,
  toHex,
  Transport,
} from "viem";

import { DAOClient } from "@/interfaces/client";
import { GovernorBase } from "../governor.base";

export class COMPClient<
    TTransport extends Transport = Transport,
    TChain extends Chain = Chain,
    TAccount extends Account | undefined = Account | undefined,
  >
  extends GovernorBase
  implements DAOClient
{
  // private abi: typeof COMPGovernorAbi;
  // private address: Address;

  constructor(client: Client<TTransport, TChain, TAccount>, _address: Address) {
    super(client);
    // this.address = address;
    // this.abi = COMPGovernorAbi;
  }

  async getQuorum(): Promise<bigint> {
    //etherscan.io/address/0x309a862bbC1A00e45506cB8A802D1ff10004c8C0#readProxyContract#F26
    return parseEther("400000"); // 400k $COMP
  }

  async getProposalThreshold(): Promise<bigint> {
    // https://etherscan.io/address/0x309a862bbC1A00e45506cB8A802D1ff10004c8C0#readProxyContract#F24
    return parseEther("25000"); // 25k $COMP
  }

  async getVotingDelay(): Promise<bigint> {
    // https://etherscan.io/address/0x309a862bbC1A00e45506cB8A802D1ff10004c8C0#readProxyContract#F33
    return BigInt(13140);
  }

  async getVotingPeriod(): Promise<bigint> {
    // https://etherscan.io/address/0x309a862bbC1A00e45506cB8A802D1ff10004c8C0#readProxyContract#F34
    return BigInt(19710);
  }

  async getTimelockDelay(): Promise<bigint> {
    //etherscan.io/address/0x6d903f6003cca6255D85CcA4D3B5E5146dC33925#readContract#F2
    return BigInt(172800);
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
    return votes.forVotes;
  }
}
