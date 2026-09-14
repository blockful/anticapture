import { HTTPException } from "hono/http-exception";

import { logger } from "@/logger";

/** Third-party provider a request depends on. */
export type Upstream = "coingecko" | "dune";

/**
 * Deadline for every third-party call. Without one a hanging provider is
 * neither degraded nor errored: the request just holds a connection until the
 * client gives up, and the gateway sees a timeout rather than our fallback.
 */
export const PROVIDER_TIMEOUT_MS = 15_000;

/**
 * A third-party provider is unhealthy: network error, timeout, or a status
 * that says "try again later".
 *
 * Only this error is eligible for the stale or empty fallbacks. Our own
 * failures, such as a database error in the NFT price path or a mapping bug,
 * must never be mistaken for a provider outage: they have to stay a 5xx so the
 * HTTP error metrics and error monitoring still see them.
 *
 * Extends `HTTPException` with 503 so callers that do not degrade keep the
 * status and body they returned before.
 */
export class UpstreamUnavailableError extends HTTPException {
  readonly upstream: Upstream;

  constructor(
    upstream: Upstream,
    message: string,
    options?: { cause?: unknown },
  ) {
    super(503, { message, cause: options?.cause });
    this.name = "UpstreamUnavailableError";
    this.upstream = upstream;
  }
}

/**
 * Whether a provider status means "the provider is struggling" rather than
 * "your request is wrong". Only the former may be degraded away: an expired
 * API key or a deleted query id would otherwise serve an empty 200 forever
 * behind nothing louder than a warning.
 */
export const isDegradableUpstreamStatus = (status: number): boolean =>
  status === 408 || status === 429 || status >= 500;

/** Drops the query string so keys and ids in parameters never reach the logs. */
const redactUrl = (url: string): string => {
  try {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  } catch {
    return "(unparseable url)";
  }
};

/**
 * Builds the error for a provider that rejected our request: a bad API key, a
 * deleted query id, a wrong token id. Serving stale or empty data here would
 * hide a misconfiguration only we can fix, so it surfaces as a 502 and is
 * counted by the HTTP error metrics and the HighErrorRate alert.
 */
export const upstreamRejectedRequest = (
  upstream: Upstream,
  status: number,
  url: string,
): HTTPException => {
  logger.error(
    { upstream, status, url: redactUrl(url) },
    `${upstream} rejected the request with HTTP ${status}`,
  );
  return new HTTPException(502, {
    message: `Upstream ${upstream} rejected the request`,
  });
};
