import { isAxiosError } from "axios";
import { HTTPException } from "hono/http-exception";

import { logger } from "@/logger";

/** Third-party provider a request depends on. */
export type Upstream = "coingecko" | "compound" | "defillama" | "dune";

/**
 * Why the provider could not answer.
 *
 * `unavailable` is the transient case that should clear on its own.
 * `not_found` is a resource the provider says is gone: it will not recover by
 * itself, so operators need to see it apart from an outage even though both
 * degrade rather than 5xx.
 */
export type UpstreamFailureReason = "unavailable" | "not_found";

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
  readonly reason: UpstreamFailureReason;

  constructor(
    upstream: Upstream,
    message: string,
    options?: { cause?: unknown; reason?: UpstreamFailureReason },
  ) {
    super(503, { message, cause: options?.cause });
    this.name = "UpstreamUnavailableError";
    this.upstream = upstream;
    this.reason = options?.reason ?? "unavailable";
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

/**
 * Drops the query string so keys and ids in parameters never reach the logs.
 * Callers pass axios paths, which are relative to the client's base URL, so a
 * relative input is resolved against a placeholder origin and only the path
 * is kept; an absolute URL keeps its origin.
 */
const RELATIVE_BASE = "https://relative.invalid";
export const redactUrl = (url: string): string => {
  try {
    const parsed = new URL(url, RELATIVE_BASE);
    return parsed.origin === RELATIVE_BASE
      ? parsed.pathname
      : `${parsed.origin}${parsed.pathname}`;
  } catch {
    return "(unparseable url)";
  }
};

/**
 * What an upstream failure may say about itself in a log line. Never the
 * error object: an AxiosError carries its request config, headers and API
 * keys included, and pino serialises every enumerable property, `cause`
 * included, straight into stdout and the OpenTelemetry pipeline.
 */
export type UpstreamErrorDescription = {
  name: string;
  message: string;
  code?: string;
  status?: number;
  url?: string;
  cause?: UpstreamErrorDescription;
};

/** Nested causes described past this depth are cut, so a cyclic cause chain
 *  cannot overflow the stack inside the logger on the error path. */
const MAX_CAUSE_DEPTH = 3;

export const describeUpstreamError = (
  error: unknown,
  depth = 0,
): UpstreamErrorDescription => {
  if (isAxiosError(error)) {
    return {
      name: error.name,
      message: error.message,
      ...(error.code !== undefined ? { code: error.code } : {}),
      ...(error.response?.status !== undefined
        ? { status: error.response.status }
        : {}),
      ...(error.config?.url !== undefined
        ? { url: redactUrl(error.config.url) }
        : {}),
    };
  }
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      ...(error.cause !== undefined && depth < MAX_CAUSE_DEPTH
        ? { cause: describeUpstreamError(error.cause, depth + 1) }
        : {}),
    };
  }
  return { name: "Error", message: String(error) };
};

/**
 * Builds the error for a provider that rejected our request: a bad API key, a
 * deleted query id, a wrong token id. Serving stale or empty data here would
 * hide a misconfiguration only we can fix, so it surfaces as a 502 and is
 * counted by the HTTP error metrics and the HighErrorRate alert.
 *
 * 502 is >= 500, so the gateway counts it against the circuit breaker. That is
 * intended for a bad key: a misconfiguration must be loud. It is also why a
 * 404 is not routed here (see `classifyAxiosFailure`): the breaker is keyed
 * by DAO until per-route breakers land, and a renamed slug on one chart must
 * not take every route of the DAO down with it.
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

/**
 * Turns an axios rejection into the right error: `UpstreamUnavailableError`
 * when the provider is unhealthy, a 502 when it rejected our request.
 */
export const classifyAxiosFailure = (
  upstream: Upstream,
  error: unknown,
  path: string,
  message: string,
): HTTPException => {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  // A 404 is a resource the provider says is gone: a renamed DefiLlama slug,
  // a deleted Dune query, a token CoinGecko no longer lists. Before this
  // classification existed the route served an empty 200, and a 502 here
  // would trip the DAO's gateway breaker over one chart. It degrades under
  // `not_found`, which the log, the metric and the alert keep apart from an
  // outage, since it will not clear on its own. A 401 or 403 stays loud.
  if (status === 404) {
    logger.error(
      { upstream, status, url: redactUrl(path) },
      `${upstream} says the resource is gone`,
    );
    return new UpstreamUnavailableError(upstream, message, {
      cause: error,
      reason: "not_found",
    });
  }
  if (status !== undefined && !isDegradableUpstreamStatus(status)) {
    return upstreamRejectedRequest(upstream, status, path);
  }
  logger.error(
    {
      upstream,
      status,
      url: redactUrl(path),
      err: describeUpstreamError(error),
    },
    `${upstream} request failed`,
  );
  return new UpstreamUnavailableError(upstream, message, { cause: error });
};
