import { z } from "@hono/zod-openapi";

export const HealthResponseSchema = z
  .object({
    status: z.enum(["healthy", "degraded"]),
    relayerAddress: z.string(),
    balance: z.string().openapi({ description: "Balance in ETH" }),
    belowThreshold: z.boolean(),
  })
  .openapi("HealthResponse");
