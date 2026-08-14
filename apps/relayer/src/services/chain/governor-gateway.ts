import {
  Address,
  BaseError,
  ContractFunctionRevertedError,
  ExecutionRevertedError,
  Hash,
  Hex,
  WaitForTransactionReceiptTimeoutError,
  type PublicActions,
} from "viem";

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
 * A simulation that reverted (as opposed to failing to run at all). Carries
 * only the short revert reason: full RPC error messages can embed the
 * provider URL, which may hold an API key, so they must never reach callers.
 */
export class SimulationRevertError extends Error {
  constructor(
    public readonly reason: string,
    options?: ErrorOptions,
  ) {
    super(`simulation reverted: ${reason}`, options);
    this.name = "SimulationRevertError";
  }
}

/**
 * "timeout" means the transaction was broadcast but no receipt arrived in
 * time — the caller still holds a valid tx hash, not a failure.
 */
export type ReceiptOutcome = "success" | "reverted" | "timeout";

/**
 * Domain-level view of the Governor for proposal enactment, so consumers
 * (and their tests) never deal with ABI plumbing or viem generics.
 */
export interface GovernorGateway {
  /** The governor contract address transactions must be sent to. */
  readonly address: Address;
  hashProposal(call: EnactmentCall): Promise<bigint>;
  /** Resolves to null when the governor does not know the proposal id. */
  state(proposalId: bigint): Promise<ProposalState | null>;
  proposalEta(proposalId: bigint): Promise<bigint>;
  /** Timestamp of the latest block, in unix seconds. */
  blockTimestamp(): Promise<bigint>;
  ethBalance(address: Address): Promise<bigint>;
  /** Dry-runs the call; throws SimulationRevertError when it would revert. */
  simulate(
    functionName: "queue" | "execute",
    call: EnactmentCall,
    from: Address,
  ): Promise<void>;
  waitForReceipt(txHash: Hash): Promise<ReceiptOutcome>;
}

/** The shared ChainReader plus the extra viem actions the gateway needs. */
export type GovernorChainReader = ChainReader &
  Pick<PublicActions, "getBlock" | "waitForTransactionReceipt">;

// Don't hold the HTTP response hostage to viem's 180s default: mainnet
// inclusion is ~12s, and anything slower is reported as "timeout" (the hash
// is still returned to the caller). Must also stay comfortably below
// Gateful's 30s proxy budget (apps/gateful/src/proxy/relayer.ts), which
// covers the whole request — otherwise the gateway aborts and records a
// circuit-breaker failure for a transaction that was already broadcast.
const RECEIPT_TIMEOUT_MS = 15_000;

function findRevert(err: unknown) {
  if (!(err instanceof BaseError)) return null;
  return err.walk(
    (e) =>
      e instanceof ContractFunctionRevertedError ||
      e instanceof ExecutionRevertedError,
  ) as ContractFunctionRevertedError | ExecutionRevertedError | null;
}

function revertReason(
  revert: ContractFunctionRevertedError | ExecutionRevertedError,
): string {
  if (revert instanceof ContractFunctionRevertedError) {
    return revert.reason ?? revert.data?.errorName ?? revert.shortMessage;
  }
  return revert.shortMessage;
}

export class ViemGovernorGateway implements GovernorGateway {
  constructor(
    private client: GovernorChainReader,
    readonly address: Address,
  ) {}

  async hashProposal(call: EnactmentCall): Promise<bigint> {
    return this.client.readContract({
      address: this.address,
      abi: governorAbi,
      functionName: "hashProposal",
      args: [call.targets, call.values, call.calldatas, call.descriptionHash],
    });
  }

  async state(proposalId: bigint): Promise<ProposalState | null> {
    try {
      return await this.client.readContract({
        address: this.address,
        abi: governorAbi,
        functionName: "state",
        args: [proposalId],
      });
    } catch (err) {
      // The governor reverts on unknown proposal ids; anything else (RPC
      // outage, bad ABI) must not masquerade as "not found".
      if (findRevert(err)) return null;
      throw err;
    }
  }

  async proposalEta(proposalId: bigint): Promise<bigint> {
    return this.client.readContract({
      address: this.address,
      abi: governorAbi,
      functionName: "proposalEta",
      args: [proposalId],
    });
  }

  async blockTimestamp(): Promise<bigint> {
    const { timestamp } = await this.client.getBlock();
    return timestamp;
  }

  async ethBalance(address: Address): Promise<bigint> {
    return this.client.getBalance({ address });
  }

  async simulate(
    functionName: "queue" | "execute",
    call: EnactmentCall,
    from: Address,
  ): Promise<void> {
    try {
      await this.client.simulateContract({
        address: this.address,
        abi: governorAbi,
        functionName,
        args: [call.targets, call.values, call.calldatas, call.descriptionHash],
        account: from,
      });
    } catch (err) {
      const revert = findRevert(err);
      if (revert) {
        throw new SimulationRevertError(revertReason(revert), { cause: err });
      }
      throw err;
    }
  }

  async waitForReceipt(txHash: Hash): Promise<ReceiptOutcome> {
    try {
      const receipt = await this.client.waitForTransactionReceipt({
        hash: txHash,
        timeout: RECEIPT_TIMEOUT_MS,
      });
      return receipt.status === "success" ? "success" : "reverted";
    } catch (err) {
      if (err instanceof WaitForTransactionReceiptTimeoutError) {
        return "timeout";
      }
      throw err;
    }
  }
}
