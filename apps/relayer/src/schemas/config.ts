import { z } from "@hono/zod-openapi";

export const ConfigResponseSchema = z
  .object({
    minVotingPower: z.string().openapi({
      format: "bigint",
      description:
        "Minimum voting power required to relay, as a decimal string (uint256).",
    }),
    maxRelayPerAddressPerDay: z.number().int().min(0).openapi({
      format: "bigint",
      description:
        "Maximum number of relays per address per UTC day, per operation.",
    }),
  })
  .openapi("RelayerConfigResponse");
