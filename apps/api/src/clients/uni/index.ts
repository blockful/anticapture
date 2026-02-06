import { Account, Address, Chain, Client, Transport } from "viem";
import { readContract } from "viem/actions";

import { DAOClient } from "@/clients";
import { GovernorAbi } from "./abi";
import { GovernorBase } from "../governor.base";

export class UNIClient<
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
    return "UNI";
  }

  async getQuorum(): Promise<bigint> {
    return readContract(this.client, {
      abi: this.abi,
      address: this.address,
      functionName: "quorumVotes",
      args: [],
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
          name: "delay",
        },
      ],
      address: timelockAddress,
      functionName: "delay",
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
