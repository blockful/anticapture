import {
  Abi,
  Account,
  Address,
  Chain,
  Client,
  Transport,
  zeroAddress,
} from "viem";

import { DAOClient } from "@/clients";

import { GovernorBase } from "../governor.base";

export class AAVEClient<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
>
  extends GovernorBase
  implements DAOClient
{
  protected address: Address;
  protected abi: Abi;

  constructor(client: Client<TTransport, TChain, TAccount>) {
    super(client);
    this.address = zeroAddress;
    this.abi = [];
  }

  getDaoId(): string {
    return "AAVE";
  }

  async getQuorum(): Promise<bigint> {
    return 0n;
    // return readContract(this.client, {
    //   abi: this.abi,
    //   address: this.address,
    //   functionName: "quorum",
    //   args: [BigInt(Math.floor(Date.now() / 1000))],
    // });
  }

  async getTimelockDelay(): Promise<bigint> {
    return 0n;
    // const timelockAddress = await readContract(this.client, {
    //   abi: this.abi,
    //   address: this.address,
    //   functionName: "timelock",
    // });
    // return readContract(this.client, {
    //   abi: [
    //     {
    //       inputs: [],
    //       name: "getMinDelay",
    //       outputs: [
    //         {
    //           internalType: "uint256",
    //           name: "",
    //           type: "uint256",
    //         },
    //       ],
    //       stateMutability: "view",
    //       type: "function",
    //     },
    //   ],
    //   address: timelockAddress,
    //   functionName: "getMinDelay",
    // });
  }

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes;
  }
}
