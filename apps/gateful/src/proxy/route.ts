import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import { proxy as honoProxy } from "hono/proxy";

/**
 * Registers a catch-all reverse proxy that forwards requests to the
 * appropriate DAO backend API.
 *
 * Must be registered **after** all specific routes (health, daos, etc.)
 * so it only catches unmatched requests.
 */
export function proxy(app: OpenAPIHono, daoApis: Map<string, string>) {
  // Two route patterns share the same handler — path-based matches first
  app.all("/:dao{[^/]+}/*", handler);

  async function handler(c: Context) {
    const paramDao = c.req.param("dao");
    if (!paramDao) {
      return c.json(
        {
          error:
            "Missing DAO identifier. Use /:dao/* path or anticapture-dao-id header",
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

    const url = new URL(resolved.path || "/", daoAPI);
    url.search = new URL(c.req.url).search;
    return honoProxy(url.toString(), { ...c.req });
  }
}
