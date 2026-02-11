import { Account, Address, Chain, Client, Transport } from "viem";
import { getBlockNumber, readContract } from "viem/actions";

import { DAOClient } from "@/clients";
import { ENSGovernorAbi } from "./abi";
import { GovernorBase } from "../governor.base";

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
    if (!this.cache.quorum) {
      const blockNumber = await getBlockNumber(this.client);
      const targetBlock = blockNumber - 10n;
      this.cache.quorum = await readContract(this.client, {
        abi: this.abi,
        address: this.address,
        functionName: "quorum",
        args: [targetBlock < 0n ? 0n : targetBlock],
      });
    }
    return this.cache.quorum;
  }

  async getTimelockDelay(): Promise<bigint> {
    if (!this.cache.timelockDelay) {
      const timelockAddress = await readContract(this.client, {
        abi: this.abi,
        address: this.address,
        functionName: "timelock",
      });
      this.cache.timelockDelay = await readContract(this.client, {
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
    return this.cache.timelockDelay;
  }

  calculateQuorum(votes: {
    forVotes: bigint;
    againstVotes: bigint;
    abstainVotes: bigint;
  }): bigint {
    return votes.forVotes + votes.abstainVotes;
  }
}
