import { Address, Hash, encodeFunctionData, keccak256, toBytes } from "viem";

import { createLogger, type Logger } from "@anticapture/observability";

import { governorAbi, ProposalState } from "@/abi/governor";
import { Errors } from "@/errors";
import type {
  EnactmentCall,
  GovernorGateway,
} from "@/services/chain/governor-gateway";
import { RelayerSigner } from "@/signer/types";

import type { ProposalSource } from "./proposal-source";

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
    private governor: GovernorGateway,
    private signer: RelayerSigner,
    private source: ProposalSource,
    private config: ProposalEnactmentConfig,
    private logger: Logger = createLogger("relayer-proposal-enactment"),
  ) {}

  async queue(proposalId: string): Promise<{ txHash: Hash }> {
    const call = await this.loadVerifiedCall(proposalId);

    const state = await this.governor.state(BigInt(proposalId));
    if (state !== ProposalState.Succeeded) {
      throw Errors.INVALID_PROPOSAL_STATE("queue", ProposalState[state]);
    }

    return this.broadcast(proposalId, "queue", call);
  }

  async execute(proposalId: string): Promise<{ txHash: Hash }> {
    const call = await this.loadVerifiedCall(proposalId);

    const state = await this.governor.state(BigInt(proposalId));
    if (state !== ProposalState.Queued) {
      throw Errors.INVALID_PROPOSAL_STATE("execute", ProposalState[state]);
    }

    const eta = await this.governor.proposalEta(BigInt(proposalId));
    if ((await this.governor.blockTimestamp()) < eta) {
      throw Errors.TIMELOCK_NOT_READY(eta);
    }

    return this.broadcast(proposalId, "execute", call);
  }

  /**
   * Fetches the proposal args and proves they belong to the requested
   * proposal id via the governor's hashProposal. This keeps the API as an
   * untrusted convenience: wrong or tampered data can never be broadcast.
   */
  private async loadVerifiedCall(proposalId: string): Promise<EnactmentCall> {
    const args = await this.source.getProposal(proposalId);
    if (!args) {
      throw Errors.PROPOSAL_NOT_FOUND(proposalId);
    }

    const call: EnactmentCall = {
      targets: args.targets,
      values: args.values,
      calldatas: args.calldatas,
      descriptionHash: keccak256(toBytes(args.description)),
    };

    if ((await this.governor.hashProposal(call)) !== BigInt(proposalId)) {
      throw Errors.PROPOSAL_DATA_MISMATCH(proposalId);
    }

    return call;
  }

  private async broadcast(
    proposalId: string,
    functionName: "queue" | "execute",
    call: EnactmentCall,
  ): Promise<{ txHash: Hash }> {
    const relayerAddress = await this.signer.getAddress();

    const balance = await this.governor.balanceOf(relayerAddress);
    if (balance < this.config.minBalanceWei) {
      throw Errors.RELAYER_LOW_BALANCE();
    }

    await this.governor.simulate(functionName, call, relayerAddress);

    const txHash = await this.signer.sendTransaction({
      to: this.config.governorAddress,
      data: encodeFunctionData({
        abi: governorAbi,
        functionName,
        args: [call.targets, call.values, call.calldatas, call.descriptionHash],
      }),
    });
    await this.governor.waitForReceipt(txHash);

    this.logger.info(
      { proposalId, action: functionName, txHash },
      `proposal ${functionName} broadcast`,
    );
    return { txHash };
  }
}
