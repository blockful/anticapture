import { Account, Address, Chain, Client, Transport } from "viem";

import { DAOClient } from "@/clients";
import { GovernorBase } from "../governor.base";
import { GovernorAbi } from "./abi";
import { readContract } from "viem/actions";

export class ZKClient<
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
    return "ZK";
  }

  async getQuorum(): Promise<bigint> {
    return readContract(this.client, {
      abi: this.abi,
      address: this.address,
      functionName: "quorum",
      args: [BigInt(Math.floor(Date.now() / 1000))],
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
          name: "getMinDelay",
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
      functionName: "getMinDelay",
    });
  }

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes;
  }
}
