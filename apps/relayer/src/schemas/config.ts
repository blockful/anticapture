import { z } from "@hono/zod-openapi";

export const ConfigResponseSchema = z
  .object({
    minVotingPower: z
      .string()
      .describe(
        "Minimum voting power required to relay, as a decimal string (uint256).",
      ),
    maxRelayPerAddressPerDay: z
      .number()
      .int()
      .min(0)
      .describe(
        "Maximum number of relays per address per UTC day, per operation.",
      ),
  })
  .openapi("RelayerConfigResponse");
