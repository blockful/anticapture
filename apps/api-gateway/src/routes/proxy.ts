import { Hono } from "hono";
import { getRegisteredDaos } from "../dao-registry.js";

export const proxyRoute = new Hono();

/**
 * GET|POST|PUT|DELETE /v1/:dao/*
 *
 * Transparent reverse proxy: strips the /v1/:dao prefix and forwards
 * the remaining path + query string to the registered DAO API.
 *
 * Example:
 *   GET /v1/ens/proposals?limit=10
 *   → GET http://ens.railway.internal:42069/proposals?limit=10
 */
proxyRoute.all("/v1/:dao/*", async (c) => {
  const daoId = c.req.param("dao").toLowerCase();
  const daos = getRegisteredDaos();
  const baseUrl = daos.get(daoId);

  if (!baseUrl) {
    return c.json(
      {
        error: `DAO "${daoId}" is not configured. Set DAO_API_${daoId.toUpperCase()} to enable it.`,
      },
      404,
    );
  }

  // Strip /v1/:dao prefix from the URL path
  const originalUrl = new URL(c.req.url);
  const prefix = `/v1/${daoId}`;
  const downstreamPath = originalUrl.pathname.slice(prefix.length) || "/";
  const downstreamUrl = `${baseUrl}${downstreamPath}${originalUrl.search}`;

  const upstreamRes = await fetch(downstreamUrl, {
    method: c.req.method,
    headers: c.req.raw.headers,
    body: ["GET", "HEAD"].includes(c.req.method) ? undefined : c.req.raw.body,
  });

  return new Response(upstreamRes.body, {
    status: upstreamRes.status,
    headers: upstreamRes.headers,
  });
});
