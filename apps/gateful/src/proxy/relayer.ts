import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import { proxy as honoProxy } from "hono/proxy";
const PROXY_TIMEOUT_MS = 30000;

/**
 * Forwards /:dao/relay/* to the per-DAO relayer configured via
 * DAO_RELAYER_<NAME>. Must be registered before the catch-all DAO API
 * proxy so relay traffic isn't swallowed by it.
 */
export function relayerProxy(
  app: OpenAPIHono,
  daoRelayers: Map<string, string>,
) {
  app.all("/:dao{[^/]+}/relay/*", handler);

  async function handler(c: Context) {
    const paramDao = c.req.param("dao");
    if (!paramDao) {
      return c.json({ error: "Missing DAO identifier" }, 400);
    }
    const dao = paramDao.toLowerCase();
    const relayerUrl = daoRelayers.get(dao);
    if (!relayerUrl) {
      return c.json({ error: `Relayer for DAO "${dao}" not configured` }, 404);
    }

    const upstreamPath = c.req.path.replace(`/${paramDao}`, "");
    const url = new URL(upstreamPath, relayerUrl);
    url.search = new URL(c.req.url).search;
    return honoProxy(url.toString(), {
      ...c.req,
      signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
    });
  }
}
