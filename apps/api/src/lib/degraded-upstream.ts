/**
 * Operator signal for the degraded third-party data paths.
 *
 * Dune and CoinGecko outages are served as stale or empty data instead of a
 * 5xx, so they are invisible to the HTTP error metrics. Every such response
 * increments `degraded_upstream_responses_total` and writes a `warn` log, which
 * is what the `DegradedUpstreamData` Prometheus alert fires on.
 */

import { logger } from "@/logger";
import { degradedUpstreamResponsesTotal } from "@/metrics";

import type { Upstream } from "./upstream-error";

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
  /** Upstream failure that caused the fallback, when the caller still has it. */
  error?: unknown;
  /** Extra context for the log only, kept out of the metric labels. */
  context?: Record<string, string | number>;
}

export const recordDegradedUpstream = ({
  upstream,
  resource,
  mode,
  error,
  context,
}: DegradedUpstreamEvent): void => {
  degradedUpstreamResponsesTotal.add(1, { upstream, resource, mode });
  logger.warn(
    { err: error, upstream, resource, mode, ...context },
    mode === "stale"
      ? `serving stale ${resource} after ${upstream} failure`
      : `serving empty ${resource} after ${upstream} failure`,
  );
};
