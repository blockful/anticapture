import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import { normalizeQueryArray, OrderDirectionSchema } from "../shared";

const AddressArraySchema = z
  .array(
    z
      .string()
      .refine((val) => isAddress(val, { strict: false }))
      .transform((val) => getAddress(val)),
  )
  .openapi("VoterAddressList");

export const VotersRequestSchema = z
  .object({
    skip: z.coerce
      .number()
      .int()
      .min(0, "Skip must be a non-negative integer")
      .optional()
      .default(0),
    limit: z.coerce
      .number()
      .int()
      .min(1, "Limit must be a positive integer")
      .max(100, "Limit cannot exceed 100")
      .optional()
      .default(10),
    orderDirection: OrderDirectionSchema.optional().default("desc"),
    addresses: z
      .preprocess(normalizeQueryArray, AddressArraySchema.optional())
      .optional(),
  })
  .openapi("VotersRequest", {
    description:
      "Query params used to page and filter voter and non-voter lists for a proposal.",
  });

export type VotersRequest = z.infer<typeof VotersRequestSchema>;

export const VoterResponseSchema = z
  .object({
    voter: z.string().refine((val) => isAddress(val)),
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
