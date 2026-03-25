import { z } from "@hono/zod-openapi";

export const DaoResponseSchema = z
  .object({
    id: z.string(),
    chainId: z.number(),
    quorum: z.string(),
    proposalThreshold: z.string(),
    votingDelay: z.string(),
    votingPeriod: z.string(),
    timelockDelay: z.string(),
    alreadySupportCalldataReview: z.boolean(),
    supportOffchainData: z.boolean(),
  })
  .openapi("DaoResponse", {
    description:
      "Current governance parameters and feature flags for the active DAO.",
  });

export type DaoResponse = z.infer<typeof DaoResponseSchema>;
