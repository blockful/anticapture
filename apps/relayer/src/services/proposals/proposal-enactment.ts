import { Hash, encodeFunctionData, keccak256, stringToBytes } from "viem";

import { createLogger, type Logger } from "@anticapture/observability";

import { governorAbi, ProposalState } from "@/abi/governor";
import { Errors } from "@/errors";
import {
  SimulationRevertError,
  type EnactmentCall,
  type GovernorGateway,
} from "@/services/chain/governor-gateway";
import { RelayerSigner } from "@/signer/types";

import type { ProposalSource } from "./proposal-source";

export interface ProposalEnactmentConfig {
  /** Below this relayer balance the service refuses to broadcast. */
  minBalanceWei: bigint;
}

type EnactmentAction = "queue" | "execute";

const REQUIRED_STATE: Record<EnactmentAction, ProposalState> = {
  queue: ProposalState.Succeeded,
  execute: ProposalState.Queued,
};

/**
 * Sponsors the permissionless Governor lifecycle transactions nobody else
 * pays for: queue() once a proposal succeeds and execute() once its
 * timelock eta passes. Proposal args come from an untrusted source and are
 * verified against the governor's hashProposal before anything is signed.
 */
export class ProposalEnactmentService {
  // Between sendTransaction and inclusion the chain still reports the
  // proposal as actionable, so concurrent duplicates would each pass every
  // guard and burn relayer gas on reverts. Identical requests join the
  // in-flight one instead and share its result.
  private inflight = new Map<string, Promise<{ txHash: Hash }>>();

  constructor(
    private governor: GovernorGateway,
    private signer: RelayerSigner,
    private source: ProposalSource,
    private config: ProposalEnactmentConfig,
    private logger: Logger = createLogger("relayer-proposal-enactment"),
  ) {}

  async queue(proposalId: string): Promise<{ txHash: Hash }> {
    return this.enact("queue", proposalId);
  }

  async execute(proposalId: string): Promise<{ txHash: Hash }> {
    return this.enact("execute", proposalId);
  }

  private enact(
    action: EnactmentAction,
    proposalId: string,
  ): Promise<{ txHash: Hash }> {
    const key = `${action}:${proposalId}`;
    const pending = this.inflight.get(key);
    if (pending) return pending;

    const run = this.runEnactment(action, proposalId).finally(() => {
      this.inflight.delete(key);
    });
    this.inflight.set(key, run);
    return run;
  }

  private async runEnactment(
    action: EnactmentAction,
    proposalId: string,
  ): Promise<{ txHash: Hash }> {
    // Cheap on-chain guards first: spam against unknown or settled proposals
    // must not amplify into Anticapture API calls.
    const state = await this.governor.state(BigInt(proposalId));
    if (state === null) {
      throw Errors.PROPOSAL_NOT_FOUND(proposalId);
    }
    if (state !== REQUIRED_STATE[action]) {
      throw Errors.INVALID_PROPOSAL_STATE(action, ProposalState[state]);
    }

    if (action === "execute") {
      const eta = await this.governor.proposalEta(BigInt(proposalId));
      if ((await this.governor.blockTimestamp()) < eta) {
        throw Errors.TIMELOCK_NOT_READY(eta);
      }
    }

    const call = await this.loadVerifiedCall(proposalId);
    return this.broadcast(proposalId, action, call);
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
      // stringToBytes, not toBytes: a description that happens to be a valid
      // hex string must still be hashed as the UTF-8 text the proposer signed.
      descriptionHash: keccak256(stringToBytes(args.description)),
    };

    if ((await this.governor.hashProposal(call)) !== BigInt(proposalId)) {
      throw Errors.PROPOSAL_DATA_MISMATCH(proposalId);
    }

    return call;
  }

  private async broadcast(
    proposalId: string,
    functionName: EnactmentAction,
    call: EnactmentCall,
  ): Promise<{ txHash: Hash }> {
    const relayerAddress = await this.signer.getAddress();

    const balance = await this.governor.ethBalance(relayerAddress);
    if (balance < this.config.minBalanceWei) {
      throw Errors.RELAYER_LOW_BALANCE();
    }

    try {
      await this.governor.simulate(functionName, call, relayerAddress);
    } catch (err) {
      if (err instanceof SimulationRevertError) {
        throw Errors.SIMULATION_FAILED(functionName, err.reason);
      }
      throw err;
    }

    const txHash = await this.signer.sendTransaction({
      to: this.governor.address,
      data: encodeFunctionData({
        abi: governorAbi,
        functionName,
        args: [call.targets, call.values, call.calldatas, call.descriptionHash],
      }),
    });

    const outcome = await this.governor.waitForReceipt(txHash);
    if (outcome === "reverted") {
      throw Errors.TRANSACTION_REVERTED(txHash);
    }
    if (outcome === "timeout") {
      this.logger.warn(
        { proposalId, action: functionName, txHash },
        "receipt wait timed out; transaction was broadcast",
      );
    }

    this.logger.info(
      { proposalId, action: functionName, txHash },
      `proposal ${functionName} broadcast`,
    );
    return { txHash };
  }
}
