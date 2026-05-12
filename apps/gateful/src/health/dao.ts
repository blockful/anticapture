import { createRoute, z } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";

import { logger } from "../logger.js";
import {
  CircuitOpenError,
  type CircuitBreaker,
} from "../shared/circuit-breaker.js";
import type { CircuitBreakerRegistry } from "../shared/circuit-breaker-registry.js";

const UPSTREAM_TIMEOUT_MS = 5_000;

const UpstreamHealthSchema = z.object({
  status: z.enum(["ok", "degraded", "error"]),
  database: z.enum(["ok", "error"]),
  chain: z.object({ head: z.number().int().nullable() }),
  indexer: z.object({
    lastEventTimestamp: z.number().int().nullable(),
    lagSeconds: z.number().int().nullable(),
    fresh: z.boolean(),
  }),
});

const CircuitSchema = z.object({
  state: z.enum(["CLOSED", "OPEN", "HALF_OPEN"]),
  nextRetryIn: z.number().int().optional(),
});

const ResponseSchema = UpstreamHealthSchema.extend({
  circuit: CircuitSchema,
}).openapi("DaoHealthResponse");

const route = createRoute({
  method: "get",
  path: "/{dao}/health",
  request: {
    params: z.object({
      dao: z.string().openapi({ description: "DAO identifier" }),
    }),
  },
  responses: {
    200: {
      description:
        "Per-DAO health snapshot — database, chain head, indexer freshness, and gateway circuit-breaker state.",
      content: { "application/json": { schema: ResponseSchema } },
    },
    404: {
      description: "DAO not configured.",
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
    },
    503: {
      description: "Upstream DAO API unavailable.",
      content: { "application/json": { schema: ResponseSchema } },
    },
  },
});

type UpstreamHealth = z.infer<typeof UpstreamHealthSchema>;
type Circuit = z.infer<typeof CircuitSchema>;
type DaoHealthResponse = z.infer<typeof ResponseSchema>;

function buildCircuit(breaker: CircuitBreaker): Circuit {
  const entry: Circuit = { state: breaker.state };
  const remaining = breaker.nextRetryIn;
  if (remaining > 0) entry.nextRetryIn = remaining;
  return entry;
}

function unreachablePayload(circuit: Circuit): DaoHealthResponse {
  return {
    status: "error",
    database: "error",
    chain: { head: null },
    indexer: { lastEventTimestamp: null, lagSeconds: null, fresh: false },
    circuit,
  };
}

export function daoHealth(
  app: OpenAPIHono,
  daoApis: Map<string, string>,
  registry: CircuitBreakerRegistry,
) {
  app.openapi(route, async (c) => {
    const dao = c.req.param("dao").toLowerCase();
    const baseUrl = daoApis.get(dao);
    if (!baseUrl) {
      return c.json({ error: `DAO "${dao}" not configured` }, 404);
    }

    const breaker = registry.get(dao);

    try {
      const upstream = await breaker.execute(async () => {
        const url = new URL("/health", baseUrl);
        const res = await fetch(url.toString(), {
          signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
        });
        if (res.status >= 500) {
          throw new Error(`Upstream ${dao} /health returned ${res.status}`);
        }
        return (await res.json()) as UpstreamHealth;
      });

      return c.json({ ...upstream, circuit: buildCircuit(breaker) }, 200);
    } catch (err) {
      if (err instanceof CircuitOpenError) {
        return c.json(unreachablePayload(buildCircuit(breaker)), 503);
      }
      logger.warn({ err, dao }, "per-dao health probe failed");
      return c.json(unreachablePayload(buildCircuit(breaker)), 503);
    }
  });
}
