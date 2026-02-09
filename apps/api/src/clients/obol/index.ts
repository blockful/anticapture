import { Account, Address, Chain, Client, Transport } from "viem";
import { getBlockNumber, readContract } from "viem/actions";

import { DAOClient } from "@/clients";
import { ObolGovernorAbi } from "./abi";
import { GovernorBase } from "../governor.base";

export class ObolClient<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
>
  extends GovernorBase
  implements DAOClient
{
  protected abi: typeof ObolGovernorAbi;
  protected address: Address;

  constructor(client: Client<TTransport, TChain, TAccount>, address: Address) {
    super(client);
    this.address = address;
    this.abi = ObolGovernorAbi;
  }

  getDaoId(): string {
    return "OBOL";
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
    return votes.forVotes + votes.abstainVotes;
  }
}
