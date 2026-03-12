import { Account, Address, Chain, Client, Transport } from "viem";

import { DAOClient } from "@/clients";

import { GovernorBase } from "../governor.base";

import { COMPGovernorAbi } from "./abi";

export class COMPClient<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
>
  extends GovernorBase
  implements DAOClient
{
  protected abi: typeof COMPGovernorAbi;
  protected address: Address;

  constructor(client: Client<TTransport, TChain, TAccount>, address: Address) {
    super(client);
    this.address = address;
    this.abi = COMPGovernorAbi;
  }

  getDaoId(): string {
    return "COMP";
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

  async getTimelockDelay(): Promise<bigint> {
    if (!this.cache.timelockDelay) {
      const timelockAddress = await this.readContract({
        abi: this.abi,
        address: this.address,
        functionName: "timelock",
      });
      this.cache.timelockDelay = await this.readContract({
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
    return this.cache.timelockDelay;
  }

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes;
  }
}
