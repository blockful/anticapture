import { z } from "zod";

import { Bytes32Schema, TxHashSchema } from "./evm-primitives";

// Decimal uint256 as string; reject anything that would throw inside BigInt().
const DecimalUint256Schema = z
  .string()
  .regex(/^\d+$/, "must be a non-negative decimal integer")
  .transform((v) => BigInt(v));

export const RelayVoteRequestSchema = z
  .object({
    proposalId: DecimalUint256Schema.openapi({
      type: "string",
      description: "Proposal ID as decimal string",
      example: "42",
    }),
    support: z
      .number()
      .int()
      .min(0)
      .max(2)
      .openapi({ description: "0=against, 1=for, 2=abstain" }),
    v: z.number().int().min(0).max(255),
    r: Bytes32Schema,
    s: Bytes32Schema,
  })
  .openapi("RelayVoteRequest");

export const RelayVoteResponseSchema = z
  .object({
    transactionHash: TxHashSchema,
    voter: z.string(),
  })
  .openapi("RelayVoteResponse");

export type RelayVoteRequest = z.input<typeof RelayVoteRequestSchema>;
