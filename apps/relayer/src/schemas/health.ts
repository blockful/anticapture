import { z } from "@hono/zod-openapi";

export const HealthResponseSchema = z
  .object({
    status: z.enum(["healthy", "balance_below_threshold"]),
    relayerAddress: z.string(),
    balance: z.string().openapi({ description: "Balance in ETH" }),
    belowThreshold: z.boolean(),
  })
  .openapi("HealthResponse");
