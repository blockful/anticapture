import { z } from "@hono/zod-openapi";

export const DaoResponseSchema = z
  .object({
    id: z.string().openapi({
      description: 'DAO identifier (uppercase, e.g. "ENS").',
      example: "ENS",
    }),
    chainId: z.number().int(),
    quorum: z.string(),
    proposalThreshold: z.string(),
    votingDelay: z.string(),
    votingPeriod: z.string(),
    timelockDelay: z.string(),
    supportsCalldataReview: z.boolean(),
    supportsOffchainData: z.boolean(),
  })
  .openapi("DaoResponse", {
    description:
      "Current governance parameters and feature flags for the active DAO.",
  });

export type DaoResponse = z.infer<typeof DaoResponseSchema>;
