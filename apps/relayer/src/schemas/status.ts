import { z } from "@hono/zod-openapi";

export const RelayerStatusReasonSchema = z
  .enum([
    "PAUSED",
    "RPC_UNAVAILABLE",
    "WRONG_CHAIN",
    "CHAIN_STALE",
    "LOW_BALANCE",
    "BALANCE_UNKNOWN",
    "RATE_LIMITER_UNAVAILABLE",
    "PENDING_TRANSACTIONS_STUCK",
    "RECENT_RELAY_FAILURES",
    "RELAYER_UNREACHABLE",
    "RELAYER_NOT_CONFIGURED",
  ])
  .openapi("RelayerStatusReason", {
    description:
      "Why gasless relaying cannot be used right now. " +
      "PAUSED: an operator switched gasless relaying off. " +
      "RPC_UNAVAILABLE: the relayer's RPC did not answer. " +
      "WRONG_CHAIN: the RPC serves a different chain than the one the relayer signs for. " +
      "CHAIN_STALE: the RPC's latest block is more than two minutes old. " +
      "LOW_BALANCE: the relayer wallet holds less than the configured threshold. " +
      "BALANCE_UNKNOWN: the relayer wallet's balance could not be read. " +
      "RATE_LIMITER_UNAVAILABLE: the rate limiter's storage did not answer, so every relay would be refused. " +
      "PENDING_TRANSACTIONS_STUCK: a transaction from the relayer wallet has sat unmined for five minutes. " +
      "RECENT_RELAY_FAILURES: three or more broadcasts failed within ten minutes, with no success since. " +
      "RELAYER_UNREACHABLE and RELAYER_NOT_CONFIGURED are only emitted by Gateful on the relayer's behalf: " +
      "the relayer did not answer (or its circuit is open), or the DAO has no relayer configured.",
  });

const RelayerStatusChecksSchema = z.object({
  paused: z.boolean().openapi({
    description:
      "True when an operator has switched gasless relaying off (GASLESS_PAUSED).",
  }),
  rpc: z.enum(["ok", "unavailable", "wrong_chain", "stale"]).openapi({
    description:
      "Whether the relayer's RPC answers, serves the chain the relayer signs for, and has a latest block no older than two minutes.",
  }),
  balance: z.enum(["ok", "low", "unknown"]).openapi({
    description:
      "Whether the relayer wallet's native balance is at or above the configured threshold; unknown when it could not be read.",
  }),
  rateLimiter: z.enum(["ok", "unavailable"]).openapi({
    description:
      "Whether the rate limiter's storage answered a round trip. Every relay goes through it, so without it every relay is refused.",
  }),
  pendingTransactions: z.enum(["ok", "stuck", "unknown"]).openapi({
    description:
      "Whether the relayer wallet's pending nonce has sat ahead of its mined nonce, with the mined one not moving, for five minutes. " +
      "Unknown when the nonces could not be read, which on its own does not make the relayer unavailable.",
  }),
  recentRelays: z.enum(["ok", "failing"]).openapi({
    description:
      "Whether three or more broadcasts failed within ten minutes with no success since. " +
      "Clears ten minutes after the latest failure, or on the next successful broadcast.",
  }),
});

export const RelayerStatusResponseSchema = z
  .object({
    available: z.boolean().openapi({
      description:
        "True only when every check passed, which is also when reasons is empty. " +
        "Anything other than an answer with available: true means gasless relaying should not be offered.",
    }),
    reasons: z.array(RelayerStatusReasonSchema).openapi({
      description: "Every check that failed. Empty when available.",
    }),
    checks: RelayerStatusChecksSchema.optional().openapi({
      description:
        "Outcome of each check the relayer ran. Absent when Gateful answered on the relayer's behalf.",
    }),
    balanceWei: z.string().optional().openapi({
      format: "bigint",
      description:
        "Current native balance of the relayer wallet, as a decimal string (uint256, in wei). Absent when it could not be read.",
    }),
    thresholdWei: z.string().optional().openapi({
      format: "bigint",
      description:
        "Minimum native balance the relayer must hold to be considered funded, as a decimal string (uint256, in wei). Absent when Gateful answered on the relayer's behalf.",
    }),
    checkedAt: z.iso.datetime().openapi({
      description:
        "ISO 8601 timestamp of when the checks ran. Answers are reused for a few seconds, so it can trail the request.",
    }),
  })
  .openapi("RelayerStatusResponse");

export type RelayerStatusReason = z.infer<typeof RelayerStatusReasonSchema>;
export type RelayerStatusChecks = z.infer<typeof RelayerStatusChecksSchema>;
export type RelayerStatusResponse = z.infer<typeof RelayerStatusResponseSchema>;
