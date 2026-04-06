import { z } from "@hono/zod-openapi";
import { isAddress } from "viem";

export const OffchainVoterResponseSchema = z
  .object({
    voter: z.string().refine((val) => isAddress(val)),
    votingPower: z.string(),
  })
  .openapi("OffchainVote");

export type OffchainVoterResponse = z.infer<typeof OffchainVoterResponseSchema>;

export const OffchainVotersResponseSchema = z
  .object({
    items: z.array(OffchainVoterResponseSchema),
    totalCount: z.number().int(),
  })
  .openapi("OffchainVotersResponse");

export type OffchainVotersResponse = z.infer<
  typeof OffchainVotersResponseSchema
>;
