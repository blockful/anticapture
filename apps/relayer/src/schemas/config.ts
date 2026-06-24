import { z } from "@hono/zod-openapi";

export const ConfigResponseSchema = z
  .object({
    minVotingPower: z.string().openapi({
      format: "int64",
      description:
        "Minimum voting power required to relay, as a decimal string (uint256).",
    }),
    limits: z
      .object({
        vote: z.number().int().min(0),
        delegation: z.number().int().min(0),
      })
      .openapi({
        description:
          "Maximum number of relays per address per calendar month (UTC), per operation.",
      }),
  })
  .openapi("RelayerConfigResponse");
