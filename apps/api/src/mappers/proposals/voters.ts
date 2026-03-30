import { z } from "@hono/zod-openapi";

import {
  AddressQueryArraySchema,
  AddressSchema,
  OrderDirectionSchema,
  paginationLimitQueryParam,
  paginationSkipQueryParam,
} from "../shared";

export const VotersRequestSchema = z
  .object({
    skip: paginationSkipQueryParam(),
    limit: paginationLimitQueryParam(),
    orderDirection: OrderDirectionSchema.optional().default("desc"),
    addresses: AddressQueryArraySchema.optional(),
  })
  .openapi("VotersRequest", {
    description:
      "Query params used to page and filter voter and non-voter lists for a proposal.",
  });

export type VotersRequest = z.infer<typeof VotersRequestSchema>;

export const VoterResponseSchema = z
  .object({
    voter: AddressSchema,
    votingPower: z.string(),
    lastVoteTimestamp: z.number(),
    votingPowerVariation: z.string(),
  })
  .openapi("Voter", {
    description: "Voter or non-voter record associated with a proposal.",
  });

export type VoterResponse = z.infer<typeof VoterResponseSchema>;

export const VotersResponseSchema = z
  .object({
    items: z.array(VoterResponseSchema),
    totalCount: z.number().int(),
  })
  .openapi("VotersResponse", {
    description: "Paginated voter or non-voter records for a proposal.",
  });

export type VotersResponse = z.infer<typeof VotersResponseSchema>;
