import { z } from "zod";

import { Bytes32Schema, TxHashSchema } from "./evm-primitives";

export const RelayVoteRequestSchema = z
  .object({
    proposalId: z
      .string()
      .openapi({ description: "Proposal ID as decimal string", example: "42" }),
    support: z
      .number()
      .int()
      .min(0)
      .max(2)
      .openapi({ description: "0=against, 1=for, 2=abstain" }),
    v: z.number().int(),
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

export type RelayVoteRequest = z.infer<typeof RelayVoteRequestSchema>;
