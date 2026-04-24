import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import { proxy as honoProxy } from "hono/proxy";

import type { CircuitBreakerRegistry } from "../shared/circuit-breaker-registry.js";

/**
 * Registers a catch-all reverse proxy that forwards requests to the
 * appropriate DAO backend API.
 *
 * Must be registered **after** all specific routes (health, daos, etc.)
 * so it only catches unmatched requests.
 */
export function proxy(
  app: OpenAPIHono,
  daoApis: Map<string, string>,
  registry: CircuitBreakerRegistry,
) {
  // Register path-based matches before the fallback catch-alls so the DAO
  // param is available when present in the URL.
  app.all("/:dao{[^/]+}/*", handler);
  app.all("/", handler);
  app.all("/*", handler);

  async function handler(c: Context) {
    const paramDao = c.req.param("dao");
    if (!paramDao) {
      return c.json(
        {
          error: "Missing DAO identifier. Use /:dao/* path",
        },
        400,
      );
    }

    const resolved = {
      dao: paramDao.toLowerCase(),
      path: c.req.path.replace(`/${paramDao}`, ""),
    };

    const daoAPI = daoApis.get(resolved.dao);
    if (!daoAPI) {
      return c.json({ error: `DAO "${resolved.dao}" not configured` }, 404);
    }

    return registry.get(resolved.dao).execute(async () => {
      const url = new URL(resolved.path || "/", daoAPI);
      url.search = new URL(c.req.url).search;
      const res = await honoProxy(url.toString(), { ...c.req });
      if (res.status >= 500) {
        throw new Error(`Upstream ${resolved.dao} returned ${res.status}`);
      }
      return res;
    });
  }
}
