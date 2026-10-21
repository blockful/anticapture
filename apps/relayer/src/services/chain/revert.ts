import {
  BaseError,
  ContractFunctionRevertedError,
  ExecutionRevertedError,
} from "viem";

/**
 * The contract revert inside a viem error, or null when the call failed for
 * another reason (transport, timeout, a malformed response).
 */
export function findRevert(err: unknown) {
  if (!(err instanceof BaseError)) return null;
  return err.walk(
    (e) =>
      e instanceof ContractFunctionRevertedError ||
      e instanceof ExecutionRevertedError,
  ) as ContractFunctionRevertedError | ExecutionRevertedError | null;
}

/**
 * Only the short revert reason: full RPC error messages can embed the
 * provider URL, which may hold an API key, so they must never reach callers.
 */
export function revertReason(
  revert: ContractFunctionRevertedError | ExecutionRevertedError,
): string {
  if (revert instanceof ContractFunctionRevertedError) {
    return revert.reason ?? revert.data?.errorName ?? revert.shortMessage;
  }
  return revert.shortMessage;
}
