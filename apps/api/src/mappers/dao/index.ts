import { z } from "@hono/zod-openapi";

export const DaoResponseSchema = z.object({
  id: z.string(),
  chainId: z.number(),
  quorum: z.string(),
  proposalThreshold: z.string(),
  votingDelay: z.string(),
  votingPeriod: z.string(),
  timelockDelay: z.string(),
  alreadySupportCalldataReview: z.boolean(),
  supportOffchainData: z.boolean(),
});

export type DaoResponse = z.infer<typeof DaoResponseSchema>;
