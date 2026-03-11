import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";

/**
 * Extracts the DAO identifier and the forwarding path from the request.
 *
 * Supports two strategies (in priority order):
 *  1. URL path prefix — `GET /ens/votes` → dao: "ens", path: "/votes"
 *  2. Header fallback — `GET /votes` + `anticapture-dao-id: ens` → dao: "ens", path: "/votes"
 *
 * Returns null if no DAO identifier is found.
 */
function resolveDaoFromRequest(
  c: Context,
): { dao: string; path: string } | null {
  const paramDao = c.req.param("dao");
  if (paramDao) {
    return {
      dao: paramDao.toLowerCase(),
      path: c.req.path.replace(`/${paramDao}`, ""),
    };
  }

  const headerDao = c.req.header("anticapture-dao-id");
  if (headerDao) {
    return { dao: headerDao.toLowerCase(), path: c.req.path };
  }

  return null;
}

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
  app.all("/*", handler);

  async function handler(c: Context) {
    const resolved = resolveDaoFromRequest(c);

    if (!resolved) {
      return c.json(
        {
          error:
            "Missing DAO identifier. Use /:dao/* path or anticapture-dao-id header",
        },
        400,
      );
    }

    const daoAPI = daoApis.get(resolved.dao);
    if (!daoAPI) {
      return c.json({ error: `DAO "${resolved.dao}" not configured` }, 404);
    }

    const url = new URL(resolved.path || "/", daoAPI);
    url.search = new URL(c.req.url).search;

    const res = await fetch(url.toString(), {
      method: c.req.method,
      headers: c.req.raw.headers,
      body: c.req.method !== "GET" ? await c.req.raw.text() : undefined,
    });

    return new Response(res.body, { status: res.status, headers: res.headers });
  }
}
