import { z } from "@hono/zod-openapi";
import { getAddress, isAddress } from "viem";

import { paginatedListResponse } from "../shared";
export const OffchainVoterResponseSchema = z
  .object({
    voter: z
      .string()
      .refine((val) => isAddress(val, { strict: false }))
      .transform((val) => getAddress(val)),
    votingPower: z.string(),
  })
  .openapi("OffchainNonVoter");

export type OffchainVoterResponse = z.infer<typeof OffchainVoterResponseSchema>;

export const OffchainVotersResponseSchema = paginatedListResponse(
  OffchainVoterResponseSchema,
).openapi("OffchainVotersResponse");

export type OffchainVotersResponse = z.infer<
  typeof OffchainVotersResponseSchema
>;
