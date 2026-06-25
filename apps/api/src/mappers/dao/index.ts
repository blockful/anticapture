import { z } from "@hono/zod-openapi";

export const DaoResponseSchema = z
  .object({
    id: z.string().openapi({
      description: 'DAO identifier (uppercase, e.g. "ENS").',
      example: "ENS",
    }),
    chainId: z.number().int(),
    quorum: z.string().openapi({ format: "int64" }),
    proposalThreshold: z.string().openapi({ format: "int64" }),
    votingDelay: z.string().openapi({ format: "int64" }),
    votingPeriod: z.string().openapi({ format: "int64" }),
    timelockDelay: z.string().openapi({ format: "int64" }),
    supportsCalldataReview: z.boolean(),
    supportsOffchainData: z.boolean(),
  })
  .openapi("DaoResponse", {
    description:
      "Current governance parameters and feature flags for the active DAO.",
  });

export type DaoResponse = z.infer<typeof DaoResponseSchema>;
