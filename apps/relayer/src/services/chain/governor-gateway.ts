import { Address, Hash, Hex, type PublicActions } from "viem";

import { governorAbi, ProposalState } from "@/abi/governor";

import type { ChainReader } from "./chain-reader";

/** queue()/execute() argument tuple, with the description already hashed. */
export interface EnactmentCall {
  targets: Address[];
  values: bigint[];
  calldatas: Hex[];
  descriptionHash: Hex;
}

/**
 * Domain-level view of the Governor for proposal enactment, so consumers
 * (and their tests) never deal with ABI plumbing or viem generics.
 */
export interface GovernorGateway {
  hashProposal(call: EnactmentCall): Promise<bigint>;
  state(proposalId: bigint): Promise<ProposalState>;
  proposalEta(proposalId: bigint): Promise<bigint>;
  /** Timestamp of the latest block, in unix seconds. */
  blockTimestamp(): Promise<bigint>;
  balanceOf(address: Address): Promise<bigint>;
  /** Dry-runs the call, throwing with the revert reason when it cannot land. */
  simulate(
    functionName: "queue" | "execute",
    call: EnactmentCall,
    from: Address,
  ): Promise<void>;
  waitForReceipt(txHash: Hash): Promise<void>;
}

/** The shared ChainReader plus the extra viem actions the gateway needs. */
export type GovernorChainReader = ChainReader &
  Pick<PublicActions, "getBlock" | "waitForTransactionReceipt">;

export class ViemGovernorGateway implements GovernorGateway {
  constructor(
    private client: GovernorChainReader,
    private governorAddress: Address,
  ) {}

  async hashProposal(call: EnactmentCall): Promise<bigint> {
    return this.client.readContract({
      address: this.governorAddress,
      abi: governorAbi,
      functionName: "hashProposal",
      args: [call.targets, call.values, call.calldatas, call.descriptionHash],
    });
  }

  async state(proposalId: bigint): Promise<ProposalState> {
    return this.client.readContract({
      address: this.governorAddress,
      abi: governorAbi,
      functionName: "state",
      args: [proposalId],
    });
  }

  async proposalEta(proposalId: bigint): Promise<bigint> {
    return this.client.readContract({
      address: this.governorAddress,
      abi: governorAbi,
      functionName: "proposalEta",
      args: [proposalId],
    });
  }

  async blockTimestamp(): Promise<bigint> {
    const { timestamp } = await this.client.getBlock();
    return timestamp;
  }

  async balanceOf(address: Address): Promise<bigint> {
    return this.client.getBalance({ address });
  }

  async simulate(
    functionName: "queue" | "execute",
    call: EnactmentCall,
    from: Address,
  ): Promise<void> {
    await this.client.simulateContract({
      address: this.governorAddress,
      abi: governorAbi,
      functionName,
      args: [call.targets, call.values, call.calldatas, call.descriptionHash],
      account: from,
    });
  }

  async waitForReceipt(txHash: Hash): Promise<void> {
    await this.client.waitForTransactionReceipt({ hash: txHash });
  }
}
