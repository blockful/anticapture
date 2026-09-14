import { HTTPException } from "hono/http-exception";

/** Third-party provider a request depends on. */
export type Upstream = "coingecko" | "dune";

/**
 * A third-party provider call failed: network error, timeout, non-2xx, rate
 * limit, or a body that does not match its documented shape.
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
