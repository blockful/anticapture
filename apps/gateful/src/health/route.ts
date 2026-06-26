import { createRoute, z } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";

import type { CircuitBreaker } from "../shared/circuit-breaker";
import type { CircuitBreakerRegistry } from "../shared/circuit-breaker-registry";

const HEALTH_PROBE_TIMEOUT_MS = 3_000;

const UpstreamStatusSchema = z.object({
  status: z.enum(["ok", "down"]),
  circuit: z.enum(["CLOSED", "OPEN", "HALF_OPEN"]),
  nextRetryIn: z.number().int().optional(),
  error: z.string().optional(),
});

const HealthResponseSchema = z.object({
  status: z.enum(["ok", "degraded"]),
  commit: z.string().optional(),
  upstreams: z.record(z.string(), UpstreamStatusSchema),
});

const route = createRoute({
  method: "get",
  operationId: "gatewayHealth",
  path: "/health",
  summary: "Gateway health and upstream dependency states",
  description:
    "Returns 200 only when every configured DAO API, relayer, and address enrichment upstream responds to /health.",
  tags: ["system"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
      description: "Gateway and every configured upstream are healthy.",
    },
    503: {
      content: {
        "application/json": {
          schema: HealthResponseSchema,
        },
      },
      description: "At least one configured upstream is unavailable.",
    },
  },
});

type HealthOptions = {
  daoApis: Map<string, string>;
  daoRelayers: Map<string, string>;
  addressEnrichmentUrl?: string;
  commitSha?: string;
};

type ProbeTarget = {
  name: string;
  baseUrl: string;
  circuitKey: string;
};

type UpstreamStatus = z.infer<typeof UpstreamStatusSchema>;
type HealthResponse = z.infer<typeof HealthResponseSchema>;

function buildCircuit(breaker: CircuitBreaker) {
  const circuit: Pick<UpstreamStatus, "circuit" | "nextRetryIn"> = {
    circuit: breaker.state,
  };
  const remaining = breaker.nextRetryIn;
  if (remaining > 0) {
    circuit.nextRetryIn = remaining;
  }
  return circuit;
}

function buildProbeTargets(opts: HealthOptions): ProbeTarget[] {
  const targets: ProbeTarget[] = [];

  for (const [dao, baseUrl] of opts.daoApis) {
    targets.push({ name: dao, baseUrl, circuitKey: dao });
  }

  for (const [dao, baseUrl] of opts.daoRelayers) {
    targets.push({
      name: `relayer:${dao}`,
      baseUrl,
      circuitKey: `relayer:${dao}`,
    });
  }

  if (opts.addressEnrichmentUrl) {
    targets.push({
      name: "address-enrichment",
      baseUrl: opts.addressEnrichmentUrl,
      circuitKey: "address-enrichment",
    });
  }

  return targets;
}

async function probeTarget(
  target: ProbeTarget,
  registry: CircuitBreakerRegistry,
): Promise<[string, UpstreamStatus]> {
  const breaker = registry.get(target.circuitKey);

  // Read-only probe: reflect the proxy circuit's state but never run through
  // breaker.execute(). /health is public and polled by CI/orchestrators —
  // routing probes through the breaker would let probe failures trip the
  // real-traffic circuit (or steal its single HALF_OPEN slot) and take routes
  // offline before any user request actually fails.
  if (breaker.state === "OPEN") {
    return [
      target.name,
      { status: "down", ...buildCircuit(breaker), error: "circuit open" },
    ];
  }

  try {
    const url = new URL("/health", target.baseUrl);
    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(HEALTH_PROBE_TIMEOUT_MS),
    });
    if (!res.ok) {
      throw new Error(`${target.name} /health returned ${res.status}`);
    }

    return [
      target.name,
      {
        status: "ok",
        ...buildCircuit(breaker),
      },
    ];
  } catch (err) {
    return [
      target.name,
      {
        status: "down",
        ...buildCircuit(breaker),
        error: err instanceof Error ? err.message : "health probe failed",
      },
    ];
  }
}

export function health(
  app: OpenAPIHono,
  registry: CircuitBreakerRegistry,
  opts: HealthOptions,
) {
  app.openapi(route, async (c) => {
    const results = await Promise.allSettled(
      buildProbeTargets(opts).map((target) => probeTarget(target, registry)),
    );
    const entries = results.map((result) => {
      if (result.status === "fulfilled") {
        return result.value;
      }

      return [
        "unknown",
        {
          status: "down",
          circuit: "CLOSED",
          error: "health probe failed",
        },
      ] satisfies [string, UpstreamStatus];
    });
    const upstreams = Object.fromEntries(entries);
    const status = entries.every(([, upstream]) => upstream.status === "ok")
      ? "ok"
      : "degraded";
    const body: HealthResponse = {
      status,
      commit: opts.commitSha,
      upstreams,
    };

    if (status === "ok") {
      return c.json(body, 200);
    }

    return c.json(body, 503);
  });
}
