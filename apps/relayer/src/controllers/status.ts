import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";

import { RelayerStatusResponseSchema } from "@/schemas/status";
import type { RelayerStatusService } from "@/services/status/relayer-status";

export function status(
  app: Hono,
  service: Pick<RelayerStatusService, "getStatus">,
) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "getRelayerStatus",
      path: "/relay/status",
      summary: "Gasless relayer availability",
      description:
        "Answers whether the gasless relayer can be used right now, from every check the relayer can run on itself: " +
        "the pause switch, the RPC, the wallet balance, the rate limiter, pending transactions and recent broadcast failures. " +
        "Always answers 200 and reports a failed check in the body, never as an error status, so polling it cannot trip " +
        "Gateful's circuit breaker for real relay traffic. Results are reused for a few seconds.",
      tags: ["system"],
      responses: {
        200: {
          description: "Relayer availability and the outcome of each check",
          content: {
            "application/json": { schema: RelayerStatusResponseSchema },
          },
        },
      },
    }),
    async (c) => c.json(await service.getStatus(), 200),
  );
}
