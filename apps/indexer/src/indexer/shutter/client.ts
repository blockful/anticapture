import { Account, Address, Chain, Client, Transport } from "viem";
import { readContract } from "viem/actions";

import { Governor } from "@/interfaces/governor";
import { AzoriusAbi, LinearVotingStrategyAbi } from "./abi";

export class SHUGovernor<
  TTransport extends Transport = Transport,
  TChain extends Chain = Chain,
  TAccount extends Account | undefined = Account | undefined,
> implements Governor
{
  private client: Client<TTransport, TChain, TAccount>;
  private azoriusAddress: Address;
  private azoriusAbi: typeof AzoriusAbi;
  private linearVotingStrategyAddress: Address;
  private linearVotingStrategyAbi: typeof LinearVotingStrategyAbi;

  constructor(
    client: Client<TTransport, TChain, TAccount>,
    azoriusAddress: Address,
    linearVotingStrategyAddress: Address,
  ) {
    this.client = client;
    this.azoriusAddress = azoriusAddress;
    this.azoriusAbi = AzoriusAbi;
    this.linearVotingStrategyAddress = linearVotingStrategyAddress;
    this.linearVotingStrategyAbi = LinearVotingStrategyAbi;
  }

  async getQuorum(): Promise<bigint> {
    return 30n * 1000000n * 10n ** 18n;
  }

  async getProposalThreshold(): Promise<bigint> {
    return readContract(this.client, {
      abi: this.linearVotingStrategyAbi,
      address: this.linearVotingStrategyAddress,
      functionName: "requiredProposerWeight",
    });
  }

  async getVotingDelay(): Promise<bigint> {
    return 0n;
  }

  async getVotingPeriod(): Promise<bigint> {
    return BigInt(
      await readContract(this.client, {
        abi: this.linearVotingStrategyAbi,
        address: this.linearVotingStrategyAddress,
        functionName: "votingPeriod",
      }),
    );
  }

  async getTimelockDelay(): Promise<bigint> {
    return BigInt(
      await readContract(this.client, {
        abi: this.azoriusAbi,
        address: this.azoriusAddress,
        functionName: "timelockPeriod",
      }),
    );
  }
}
