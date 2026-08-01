import { z } from "@hono/zod-openapi";

export const HealthResponseSchema = z
  .object({
    status: z.literal("ok"),
    commit: z.string().optional().openapi({
      description:
        "Git SHA this relayer is running. Gateful merges this service's OpenAPI paths and schemas into its own spec, so the deploy gate uses this to tell whether the release is live here yet.",
    }),
  })
  .openapi("RelayerHealthResponse");
