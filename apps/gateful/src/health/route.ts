import { createRoute, z } from "@hono/zod-openapi";
import type { OpenAPIHono } from "@hono/zod-openapi";

import type { CircuitBreaker } from "../shared/circuit-breaker";
import type { CircuitBreakerRegistry } from "../shared/circuit-breaker-registry";

const HEALTH_PROBE_TIMEOUT_MS = 3_000;

// Which upstream this is. The deploy gate needs it to tell a DAO API — whose
// OpenAPI schemas gateful merges into /docs/json, and which must therefore be
// on the release before the SDK is generated — from upstreams that merely have
// to be reachable.
const UpstreamKindSchema = z.enum([
  "dao-api",
  "relayer",
  "address-enrichment",
  "token-service",
  // Defensive: probeTarget catches its own failures, so this is only reachable
  // if the probe promise itself rejects. Reported as down, which already fails
  // the whole response.
  "unknown",
]);

const UpstreamStatusSchema = z.object({
  kind: UpstreamKindSchema,
  status: z.enum(["ok", "down"]),
  circuit: z.enum(["CLOSED", "OPEN", "HALF_OPEN"]),
  nextRetryIn: z.number().int().optional(),
  error: z.string().optional(),
  // Absent for upstreams that don't report one. `status: "ok"` says an
  // upstream answers; this says which release is answering — the DAO APIs
  // own the schemas merged into /docs/json, so a deploy gate that only sees
  // gateful's own commit can still read the previous release's spec.
  commit: z.string().optional(),
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
    "Returns 200 only when every configured DAO API, relayer, address enrichment, and token service upstream responds to /health.",
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
  tokenServiceUrl?: string;
  commitSha?: string;
};

type ProbeTarget = {
  name: string;
  baseUrl: string;
  circuitKey: string;
  kind: UpstreamKind;
};

type UpstreamKind = z.infer<typeof UpstreamKindSchema>;
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
    targets.push({ name: dao, baseUrl, circuitKey: dao, kind: "dao-api" });
  }

  for (const [dao, baseUrl] of opts.daoRelayers) {
    targets.push({
      name: `relayer:${dao}`,
      baseUrl,
      circuitKey: `relayer:${dao}`,
      kind: "relayer",
    });
  }

  if (opts.addressEnrichmentUrl) {
    targets.push({
      name: "address-enrichment",
      baseUrl: opts.addressEnrichmentUrl,
      circuitKey: "address-enrichment",
      kind: "address-enrichment",
    });
  }

  // Authful is a runtime dependency for validating uncached tokens; report it
  // so readiness fails when it is down (the breaker key is inert here — the
  // probe never calls breaker.execute).
  if (opts.tokenServiceUrl) {
    targets.push({
      name: "authful",
      baseUrl: opts.tokenServiceUrl,
      circuitKey: "authful",
      kind: "token-service",
    });
  }

  return targets;
}

// A probe body that isn't JSON, or carries no commit, is not a failure: the
// upstream answered, which is what `status` reports. Only the commit is lost.
async function readUpstreamCommit(res: Response): Promise<string | undefined> {
  try {
    const body: unknown = await res.json();
    const commit =
      typeof body === "object" && body !== null
        ? (body as { commit?: unknown }).commit
        : undefined;

    return typeof commit === "string" && commit ? commit : undefined;
  } catch {
    return undefined;
  }
}

async function probeTarget(
  target: ProbeTarget,
  registry: CircuitBreakerRegistry,
): Promise<[string, UpstreamStatus]> {
  const breaker = registry.summary(target.circuitKey);

  // Read-only probe: reflect the proxy circuit's state but never run through
  // breaker.execute(). /health is public and polled by CI/orchestrators —
  // routing probes through the breaker would let probe failures trip the
  // real-traffic circuit (or steal its single HALF_OPEN slot) and take routes
  // offline before any user request actually fails.
  if (breaker.state === "OPEN") {
    return [
      target.name,
      {
        kind: target.kind,
        status: "down",
        ...buildCircuit(breaker),
        error: "circuit open",
      },
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

    const commit = await readUpstreamCommit(res);

    return [
      target.name,
      {
        kind: target.kind,
        status: "ok",
        ...buildCircuit(breaker),
        ...(commit ? { commit } : {}),
      },
    ];
  } catch (err) {
    return [
      target.name,
      {
        kind: target.kind,
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
          kind: "unknown",
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
