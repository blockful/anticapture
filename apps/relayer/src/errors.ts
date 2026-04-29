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
} as const;
