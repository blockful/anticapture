import { z } from "@hono/zod-openapi";

export const DaoResponseSchema = z
  .object({
    id: z.string(),
    chainId: z.number().int(),
    quorum: z.string().openapi({ format: "bigint" }),
    proposalThreshold: z.string().openapi({ format: "bigint" }),
    votingDelay: z.string().openapi({ format: "bigint" }),
    votingPeriod: z.string().openapi({ format: "bigint" }),
    timelockDelay: z.string().openapi({ format: "bigint" }),
    alreadySupportCalldataReview: z.boolean(),
    supportOffchainData: z.boolean(),
  })
  .openapi("DaoResponse", {
    description:
      "Current governance parameters and feature flags for the active DAO.",
  });

export type DaoResponse = z.infer<typeof DaoResponseSchema>;
