import { z } from "@hono/zod-openapi";

import { DecimalUint256Schema, TxHashSchema } from "./evm-primitives";

export const RelayProposalRequestSchema = z
  .object({
    proposalId: DecimalUint256Schema.openapi({
      type: "string",
      description: "Proposal ID as decimal string",
      example: "42",
    }),
  })
  .openapi("RelayerProposalRequest");

export const RelayProposalResponseSchema = z
  .object({
    transactionHash: TxHashSchema,
  })
  .openapi("RelayerProposalResponse");

export type RelayProposalRequest = z.input<typeof RelayProposalRequestSchema>;
