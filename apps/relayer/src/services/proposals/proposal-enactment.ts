import {
  Address,
  Hash,
  encodeFunctionData,
  keccak256,
  toBytes,
  type PublicActions,
} from "viem";

import { createLogger, type Logger } from "@anticapture/observability";

import { governorAbi, ProposalState } from "@/abi/governor";
import { Errors } from "@/errors";
import type { ChainReader } from "@/services/chain/chain-reader";
import { RelayerSigner } from "@/signer/types";

import type { ProposalArgs, ProposalSource } from "./proposal-source";

/** The shared ChainReader plus the extra viem actions enactment needs. */
export type EnactmentChainReader = ChainReader &
  Pick<PublicActions, "getBlock" | "waitForTransactionReceipt">;

export interface ProposalEnactmentConfig {
  governorAddress: Address;
  /** Below this relayer balance the service refuses to broadcast. */
  minBalanceWei: bigint;
}

/**
 * Sponsors the permissionless Governor lifecycle transactions nobody else
 * pays for: queue() once a proposal succeeds and execute() once its
 * timelock eta passes. Proposal args come from an untrusted source and are
 * verified against the governor's hashProposal before anything is signed.
 */
export class ProposalEnactmentService {
  constructor(
    private chain: EnactmentChainReader,
    private signer: RelayerSigner,
    private source: ProposalSource,
    private config: ProposalEnactmentConfig,
    private logger: Logger = createLogger("relayer-proposal-enactment"),
  ) {}

  async queue(proposalId: string): Promise<{ txHash: Hash }> {
    const args = await this.loadVerifiedArgs(proposalId);

    const state = await this.readState(proposalId);
    if (state !== ProposalState.Succeeded) {
      throw Errors.INVALID_PROPOSAL_STATE("queue", ProposalState[state]);
    }

    return this.broadcast(proposalId, "queue", args);
  }

  async execute(proposalId: string): Promise<{ txHash: Hash }> {
    const args = await this.loadVerifiedArgs(proposalId);

    const state = await this.readState(proposalId);
    if (state !== ProposalState.Queued) {
      throw Errors.INVALID_PROPOSAL_STATE("execute", ProposalState[state]);
    }

    const eta = await this.chain.readContract({
      address: this.config.governorAddress,
      abi: governorAbi,
      functionName: "proposalEta",
      args: [BigInt(proposalId)],
    });
    const { timestamp } = await this.chain.getBlock();
    if (timestamp < eta) {
      throw Errors.TIMELOCK_NOT_READY(eta);
    }

    return this.broadcast(proposalId, "execute", args);
  }

  /**
   * Fetches the proposal args and proves they belong to the requested
   * proposal id via the governor's hashProposal. This keeps the API as an
   * untrusted convenience: wrong or tampered data can never be broadcast.
   */
  private async loadVerifiedArgs(proposalId: string): Promise<ProposalArgs> {
    const args = await this.source.getProposal(proposalId);
    if (!args) {
      throw Errors.PROPOSAL_NOT_FOUND(proposalId);
    }

    const hashed = await this.chain.readContract({
      address: this.config.governorAddress,
      abi: governorAbi,
      functionName: "hashProposal",
      args: [
        args.targets,
        args.values,
        args.calldatas,
        keccak256(toBytes(args.description)),
      ],
    });
    if (hashed !== BigInt(proposalId)) {
      throw Errors.PROPOSAL_DATA_MISMATCH(proposalId);
    }

    return args;
  }

  private async readState(proposalId: string): Promise<ProposalState> {
    return this.chain.readContract({
      address: this.config.governorAddress,
      abi: governorAbi,
      functionName: "state",
      args: [BigInt(proposalId)],
    });
  }

  private async broadcast(
    proposalId: string,
    functionName: "queue" | "execute",
    proposalArgs: ProposalArgs,
  ): Promise<{ txHash: Hash }> {
    const relayerAddress = await this.signer.getAddress();

    const balance = await this.chain.getBalance({ address: relayerAddress });
    if (balance < this.config.minBalanceWei) {
      throw Errors.RELAYER_LOW_BALANCE();
    }

    const args = [
      proposalArgs.targets,
      proposalArgs.values,
      proposalArgs.calldatas,
      keccak256(toBytes(proposalArgs.description)),
    ] as const;

    await this.chain.simulateContract({
      address: this.config.governorAddress,
      abi: governorAbi,
      functionName,
      args,
      account: relayerAddress,
    });

    const txHash = await this.signer.sendTransaction({
      to: this.config.governorAddress,
      data: encodeFunctionData({ abi: governorAbi, functionName, args }),
    });
    await this.chain.waitForTransactionReceipt({ hash: txHash });

    this.logger.info(
      { proposalId, action: functionName, txHash },
      `proposal ${functionName} broadcast`,
    );
    return { txHash };
  }
}
