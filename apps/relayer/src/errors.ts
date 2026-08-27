import { z } from "@hono/zod-openapi";

export const ErrorResponseSchema = z
  .object({
    error: z.string(),
    code: z.string(),
  })
  .openapi("RelayerErrorResponse");

export class RelayError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status: number = 400,
  ) {
    super(message);
    this.name = "RelayError";
  }
}

// All errors are factory functions to avoid shared mutable instances
// (stack traces, request context leaking across requests)
export const Errors = {
  INSUFFICIENT_VOTING_POWER: (min: string) =>
    new RelayError(
      `Signer does not meet minimum voting power: ${min}`,
      "INSUFFICIENT_VOTING_POWER",
    ),
  INVALID_SIGNATURE: () =>
    new RelayError(
      "Could not recover a valid signer from signature",
      "INVALID_SIGNATURE",
    ),
  RATE_LIMITED: () =>
    new RelayError("Rate limit exceeded for this address", "RATE_LIMITED", 429),
  RELAYER_LOW_BALANCE: () =>
    new RelayError(
      "Relayer wallet balance is too low to submit transactions",
      "RELAYER_LOW_BALANCE",
      503,
    ),
  INVALID_CONTRACT: () =>
    new RelayError(
      "Target contract is not in the whitelist",
      "INVALID_CONTRACT",
    ),
  RATE_LIMITER_UNAVAILABLE: () =>
    new RelayError(
      "Rate limiter is unavailable, please try again later",
      "RATE_LIMITER_UNAVAILABLE",
      503,
    ),
  PROPOSAL_NOT_FOUND: (proposalId: string) =>
    new RelayError(
      `Proposal ${proposalId} was not found`,
      "PROPOSAL_NOT_FOUND",
      404,
    ),
  PROPOSAL_DATA_MISMATCH: (proposalId: string) =>
    new RelayError(
      `Proposal data does not hash to the requested proposal id ${proposalId}`,
      "PROPOSAL_DATA_MISMATCH",
      422,
    ),
  INVALID_PROPOSAL_STATE: (action: string, state: string) =>
    new RelayError(
      `Proposal cannot be ${action}d while in state ${state}`,
      "INVALID_PROPOSAL_STATE",
      409,
    ),
  TIMELOCK_NOT_READY: (eta: bigint) =>
    new RelayError(
      `Proposal timelock is not ready; executable at ${eta.toString()} (unix seconds)`,
      "TIMELOCK_NOT_READY",
      409,
    ),
  SIMULATION_FAILED: (action: string, reason: string) =>
    new RelayError(
      `Simulation of ${action}() reverted: ${reason}`,
      "SIMULATION_FAILED",
      409,
    ),
  TRANSACTION_REVERTED: (txHash: string) =>
    new RelayError(
      `Transaction ${txHash} was mined but reverted on-chain`,
      "TRANSACTION_REVERTED",
      409,
    ),
} as const;
