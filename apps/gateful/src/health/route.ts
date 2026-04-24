import { createRoute, z } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";

import type { CircuitBreakerRegistry } from "../shared/circuit-breaker-registry.js";

const CircuitStatusSchema = z.object({
  state: z.enum(["CLOSED", "OPEN", "HALF_OPEN"]),
  nextRetryIn: z.number().optional(),
});

const HealthResponseSchema = z.object({
  status: z.literal("ok"),
  circuits: z.record(z.string(), CircuitStatusSchema),
});

const route = createRoute({
  method: "get",
  path: "/health",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
      description: "Gateway health and per-DAO circuit breaker states",
    },
  },
});

type CircuitStatus = z.infer<typeof CircuitStatusSchema>;

export function health(app: OpenAPIHono, registry: CircuitBreakerRegistry) {
  app.openapi(route, (c) => {
    const circuits: Record<string, CircuitStatus> = {};

    for (const [name, breaker] of registry.getAll()) {
      const entry: CircuitStatus = { state: breaker.state };
      const remaining = breaker.nextRetryIn;
      if (remaining > 0) {
        entry.nextRetryIn = remaining;
      }
      circuits[name] = entry;
    }

    return c.json({ status: "ok" as const, circuits });
  });
}
