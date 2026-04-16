import { z } from "@hono/zod-openapi";

export const ErrorResponseSchema = z
  .object({
    error: z.string(),
    code: z.string(),
  })
  .openapi("ErrorResponse");

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
      `Voter does not meet minimum voting power: ${min}`,
      "INSUFFICIENT_VOTING_POWER",
    ),
  DELEGATION_COOLDOWN: (days: number) =>
    new RelayError(
      `Last delegation change was less than ${days} days ago`,
      "DELEGATION_COOLDOWN",
    ),
  INVALID_SIGNATURE: () =>
    new RelayError(
      "Could not recover a valid signer from signature",
      "INVALID_SIGNATURE",
    ),
  PROPOSAL_NOT_ACTIVE: () =>
    new RelayError(
      "Proposal is not in active voting period",
      "PROPOSAL_NOT_ACTIVE",
    ),
  ALREADY_VOTED: () =>
    new RelayError(
      "Address has already voted on this proposal",
      "ALREADY_VOTED",
    ),
  SIGNATURE_EXPIRED: () =>
    new RelayError("Delegation signature has expired", "SIGNATURE_EXPIRED"),
  NONCE_MISMATCH: (expected: string, got: string) =>
    new RelayError(
      `Nonce mismatch: on-chain=${expected}, provided=${got}`,
      "NONCE_MISMATCH",
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
} as const;
