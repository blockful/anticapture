/**
 * Operator signal for the degraded third-party data paths.
 *
 * Dune and CoinGecko outages are served as stale or empty data instead of a
 * 5xx, so they are invisible to the HTTP error metrics. Every such response
 * increments `degraded_upstream_responses_total` and writes a `warn` log, which
 * is what the `DegradedUpstreamData` Prometheus alert fires on.
 */

import {
  describeUpstreamError,
  type Upstream,
  type UpstreamFailureReason,
} from "@/lib/upstream-error";
import { logger } from "@/logger";
import { degradedUpstreamResponsesTotal } from "@/metrics";

/** `stale` served the last known payload, `empty` had nothing to serve. */
export type DegradedMode = "stale" | "empty";

/**
 * A payload plus whether it is a degraded copy. Controllers need this to put
 * `no-store` on stale responses: caching day-old prices downstream for the
 * route's regular TTL would outlive the outage that produced them.
 */
export interface MaybeDegraded<T> {
  data: T;
  degraded: boolean;
}

/** Cache headers for a degraded response, so the fallback is never stored. */
export const DEGRADED_CACHE_HEADERS = { "Cache-Control": "no-store" } as const;

export interface DegradedUpstreamEvent {
  /** Provider whose failure triggered the fallback. */
  upstream: Upstream;
  /** Dataset served in degraded form, e.g. `token_historical_prices`. */
  resource: string;
  mode: DegradedMode;
  /**
   * Why the provider could not answer. `not_found` will not clear on its own,
   * so it is a label rather than only a log field.
   */
  reason?: UpstreamFailureReason;
  /** Upstream failure that caused the fallback, when the caller still has it. */
  error?: unknown;
  /** Extra context for the log only, kept out of the metric labels. */
  context?: Record<string, string | number>;
}

export const recordDegradedUpstream = ({
  upstream,
  resource,
  mode,
  reason = "unavailable",
  error,
  context,
}: DegradedUpstreamEvent): void => {
  degradedUpstreamResponsesTotal.add(1, { upstream, resource, mode, reason });
  logger.warn(
    {
      // Described, not serialised: the cause is the provider's AxiosError,
      // request headers and API key included.
      ...(error !== undefined ? { err: describeUpstreamError(error) } : {}),
      upstream,
      resource,
      mode,
      reason,
      ...context,
    },
    mode === "stale"
      ? `serving stale ${resource} after ${upstream} failure`
      : `serving empty ${resource} after ${upstream} failure`,
  );
};
