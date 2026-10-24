import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import { proxy as honoProxy } from "hono/proxy";

import type { CircuitBreakerRegistry } from "../shared/circuit-breaker-registry.js";
import { stripAuthorization } from "./strip-authorization.js";

const PROXY_TIMEOUT_MS = 30000;

/**
 * The relayer bounds each of its own checks at 3s and caches the answer, so
 * anything slower than this is a relayer that is not answering.
 */
const STATUS_PROBE_TIMEOUT_MS = 5000;

/** Reasons Gateful reports on the relayer's behalf (RelayerStatusReason). */
type GatewayStatusReason = "RELAYER_UNREACHABLE" | "RELAYER_NOT_CONFIGURED";

/**
 * The relayer's RelayerStatusResponse as Gateful answers it when the relayer
 * cannot: unavailable, with no per-check detail since none of them ran.
 */
function unavailableStatus(reason: GatewayStatusReason) {
  return {
    available: false,
    reasons: [reason],
    checkedAt: new Date().toISOString(),
  };
}

/**
 * The relayer's status body, when it is one worth passing on: a 2xx JSON
 * object whose `available` is a boolean. Anything else means the relayer did
 * not really answer, so the caller reports it as unreachable instead.
 */
async function readRelayerStatus(
  res: Response,
): Promise<Record<string, unknown> | null> {
  if (!res.ok) return null;
  try {
    const body: unknown = await res.json();
    if (
      typeof body === "object" &&
      body !== null &&
      typeof (body as { available?: unknown }).available === "boolean"
    ) {
      return body as Record<string, unknown>;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * The relayer's global error handler wraps unhandled exceptions as
 * `500 { code: "INTERNAL" }`. That is a crash wearing the error contract,
 * not a deliberate answer, and must keep counting against the breaker.
 */
const RELAYER_CRASH_CODE = "INTERNAL";

/**
 * A 5xx the relayer answered deliberately, with its own error contract
 * (`{ code, message }`, e.g. `503 RELAYER_LOW_BALANCE`). The relayer is up
 * and talking, so the response goes to the client verbatim and the circuit
 * breaker does not count it as a failure. A 5xx without a `code`, or with
 * the crash code, is the platform or a failure talking, not the relayer, and
 * stays an upstream error.
 */
async function isStructuredRelayerError(res: Response): Promise<boolean> {
  if (!res.headers.get("content-type")?.includes("application/json")) {
    return false;
  }
  try {
    const body = (await res.clone().json()) as { code?: unknown };
    return (
      typeof body?.code === "string" &&
      body.code.length > 0 &&
      body.code !== RELAYER_CRASH_CODE
    );
  } catch {
    return false;
  }
}

/**
 * Forwards /:dao/relay/*, /:dao/config and /:dao/rate-limit/* to the
 * per-DAO relayer configured via DAO_RELAYER_<NAME>. Must be registered
 * before the catch-all DAO API proxy so relay traffic isn't swallowed by it.
 */
export function relayerProxy(
  app: OpenAPIHono,
  daoRelayers: Map<string, string>,
  registry: CircuitBreakerRegistry,
) {
  // Ahead of /relay/* so the status probe never takes the proxy path. Its
  // OpenAPI entry comes from the relayer's own spec, merged under /{dao}.
  app.get("/:dao{[^/]+}/relay/status", statusHandler);
  app.all("/:dao{[^/]+}/relay/*", handler);
  app.all("/:dao{[^/]+}/config", handler);
  app.all("/:dao{[^/]+}/rate-limit/*", handler);

  /**
   * Always answers 200 with a RelayerStatusResponse, so the dashboard gets
   * an answer to "can gasless be offered?" even when the relayer is down,
   * missing or behind an open circuit, and falls back to a wallet
   * transaction on anything but `available: true`.
   */
  async function statusHandler(c: Context) {
    const dao = c.req.param("dao")?.toLowerCase();
    const relayerUrl = dao ? daoRelayers.get(dao) : undefined;
    if (!dao || !relayerUrl) {
      return c.json(unavailableStatus("RELAYER_NOT_CONFIGURED"), 200);
    }

    // Read-only, the way /health reads it: while the circuit is open and
    // cooling down, real relay traffic is refused, so as far as a user is
    // concerned the relayer is unreachable.
    const breaker = registry.summary(`relayer:${dao}`);
    if (breaker.state === "OPEN" && breaker.nextRetryIn > 0) {
      return c.json(unavailableStatus("RELAYER_UNREACHABLE"), 200);
    }

    // Straight to the relayer, never through breaker.execute(): dashboards
    // poll this, and a failing probe must not trip the circuit real relay
    // traffic depends on or take its single HALF_OPEN slot (the same reason
    // probeTarget in src/health/route.ts stays off the breaker).
    try {
      const res = await honoProxy(
        new URL("/relay/status", relayerUrl).toString(),
        {
          ...c.req,
          // Strip the per-tenant bearer so it is never leaked to relayers.
          headers: stripAuthorization(c.req.raw.headers),
          signal: AbortSignal.timeout(STATUS_PROBE_TIMEOUT_MS),
        },
      );
      const status = await readRelayerStatus(res);
      if (status) {
        return c.json(status, 200);
      }
    } catch {
      // Timeout or network error: the relayer did not answer.
    }
    return c.json(unavailableStatus("RELAYER_UNREACHABLE"), 200);
  }

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

    return registry.get(`relayer:${dao}`).execute(async () => {
      const res = await honoProxy(url.toString(), {
        ...c.req,
        // Strip the per-tenant bearer so it is never leaked to relayers.
        headers: stripAuthorization(c.req.raw.headers),
        signal: AbortSignal.timeout(PROXY_TIMEOUT_MS),
      });
      if (res.status >= 500 && !(await isStructuredRelayerError(res))) {
        throw new Error(`Upstream relayer:${dao} returned ${res.status}`);
      }
      return res;
    });
  }
}
