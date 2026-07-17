import { Account, Address, Chain, Client, Transport } from "viem";

import { DAOClient } from "@/clients";

import { GovernorBase } from "../governor.base";

import { ENSGovernorAbi } from "./abi";

export class ENSClient<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
>
  extends GovernorBase
  implements DAOClient
{
  protected abi: typeof ENSGovernorAbi;
  protected address: Address;

  constructor(client: Client<TTransport, TChain, TAccount>, address: Address) {
    super(client);
    this.address = address;
    this.abi = ENSGovernorAbi;
  }

  getDaoId(): string {
    return "ENS";
  }

  async getQuorum(): Promise<bigint> {
    return this.getCachedQuorum(async () => {
      const blockNumber = await this.getBlockNumber();
      const targetBlock = blockNumber - 10n;
      return this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "quorum",
        args: [targetBlock < 0n ? 0n : targetBlock],
      });
    });
  }

  protected async fetchTimelockDelay(): Promise<bigint> {
    const timelockAddress = await this.readContract({
      abi: this.abi,
      address: this.address,
      functionName: "timelock",
    });
    return this.readContract({
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

  alreadySupportCalldataReview(): boolean {
    return true;
  }

  supportOffchainData(): boolean {
    return true;
  }

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes + votes.abstainVotes;
  }
}
