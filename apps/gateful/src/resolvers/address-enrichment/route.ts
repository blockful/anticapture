import type { OpenAPIHono } from "@hono/zod-openapi";
import { proxy as honoProxy } from "hono/proxy";

import type { CircuitBreakerRegistry } from "../../shared/circuit-breaker-registry.js";

const PROXY_TIMEOUT_MS = 30000;

export function addressEnrichment(
  app: OpenAPIHono,
  upstreamUrl: string | undefined,
  registry: CircuitBreakerRegistry,
) {
  app.all("/address-enrichment/*", async (c) => {
    if (!upstreamUrl) {
      return c.json(
        { error: "Address enrichment service not configured" },
        404,
      );
    }

    const path = c.req.path.replace(/^\/address-enrichment/, "") || "/";
    const url = new URL(path, upstreamUrl);
    url.search = new URL(c.req.url).search;

    return registry.get("address-enrichment").execute(async () => {
      const res = await honoProxy(url.toString(), {
        ...c.req,
        signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
      });
      if (res.status >= 500) {
        throw new Error(`Upstream address-enrichment returned ${res.status}`);
      }
      return res;
    });
  });
}
