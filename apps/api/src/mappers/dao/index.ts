import { z } from "@hono/zod-openapi";

export const DaoResponseSchema = z
  .object({
    id: z.string().openapi({
      description: 'DAO identifier (uppercase, e.g. "ENS").',
      example: "ENS",
    }),
    chainId: z.number().int(),
    quorum: z.string().openapi({ format: "bigint" }),
    proposalThreshold: z.string().openapi({ format: "bigint" }),
    votingDelay: z.string().openapi({ format: "bigint" }),
    votingPeriod: z.string().openapi({ format: "bigint" }),
    timelockDelay: z.string().openapi({ format: "bigint" }),
    supportsCalldataReview: z.boolean(),
    supportsOffchainData: z.boolean(),
  })
  .openapi("DaoResponse", {
    description:
      "Current governance parameters and feature flags for the active DAO.",
  });

export type DaoResponse = z.infer<typeof DaoResponseSchema>;
