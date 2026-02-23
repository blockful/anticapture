import { Account, Address, Chain, Client, parseEther, Transport } from "viem";
import { readContract } from "viem/actions";

import { DAOClient } from "@/clients";

import { GovernorBase } from "../governor.base";

import { GovernorAbi } from "./abi/governor";

export class SCRClient<
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
    super(client);
    this.address = address;
    this.abi = GovernorAbi;
  }

  getDaoId(): string {
    return "SCR";
  }

  async getQuorum(_: string | null): Promise<bigint> {
    return parseEther("2100000"); // 2.1M $SCR (0.21% Total Supply)
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
          name: "getMinDelay",
          outputs: [
            {
              internalType: "uint256",
              name: "duration",
              type: "uint256",
            },
          ],
          stateMutability: "view",
          type: "function",
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
    return votes.forVotes + votes.abstainVotes + votes.againstVotes;
  }
}
