import { z } from "@hono/zod-openapi";

export const DaoResponseSchema = z.object({
  id: z.string(),
  chainId: z.number(),
  quorum: z.string(),
  proposalThreshold: z.string(),
  votingDelay: z.string(),
  votingPeriod: z.string(),
  timelockDelay: z.string(),
  activeSupply: z.string(),
  averageTurnout: z.object({
    oldAverageTurnout: z.string(),
    currentAverageTurnout: z.string(),
    changeRate: z.string(),
  }),
});

export type DaoResponse = z.infer<typeof DaoResponseSchema>;
