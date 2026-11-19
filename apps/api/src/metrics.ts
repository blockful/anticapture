import type { Counter, Histogram, ObservableGauge } from "@opentelemetry/api";

import { meterProvider } from "@/instrumentation";

export { exporter, meterProvider } from "@/instrumentation";

const meter = meterProvider.getMeter("anticapture-api");

export const httpRequestDuration: Histogram = meter.createHistogram(
  "http_server_request_duration_seconds",
  {
    description: "Duration of HTTP requests in seconds",
    advice: {
      explicitBucketBoundaries: [
        0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5,
      ],
    },
  },
);

export const httpRequestTotal: Counter = meter.createCounter(
  "http_server_requests_total",
  {
    description: "Total number of HTTP requests",
  },
);

export const rpcRequestTotal: Counter = meter.createCounter(
  "rpc_requests_total",
  {
    description: "Total number of RPC requests sent to the RPC node",
  },
);

/**
 * Third-party fallbacks are served as 200s, so the HTTP error metrics never see
 * them. The `DegradedUpstreamData` rule in `infra/monitoring/alerts.yml` alerts
 * on this counter; rename either side and the alert goes silent.
 */
export const degradedUpstreamResponsesTotal: Counter = meter.createCounter(
  "degraded_upstream_responses_total",
  {
    description:
      "Responses served with stale or empty data because a third-party upstream failed",
  },
);

/**
 * When the rows each revenue query serves were computed upstream (Dune's
 * `execution_ended_at`), in epoch ms, keyed by query. A stale copy served
 * after a failure keeps its original time, so the age keeps growing through
 * an outage instead of resetting.
 */
const revenueDataAsOf = new Map<string, number>();

export const recordRevenueDataAsOf = (
  query: string,
  asOf: string | null,
): void => {
  const asOfMs = asOf === null ? Number.NaN : Date.parse(asOf);
  // An unknown age is reported as no series, never as a made-up one.
  if (Number.isNaN(asOfMs)) {
    revenueDataAsOf.delete(query);
    return;
  }
  revenueDataAsOf.set(query, asOfMs);
};

/** Age in seconds of every revenue query seen by this process. */
export const revenueDataAges = (
  now: number = Date.now(),
): { query: string; ageSeconds: number }[] =>
  [...revenueDataAsOf].map(([query, asOfMs]) => ({
    query,
    ageSeconds: (now - asOfMs) / 1000,
  }));

/**
 * A frozen Dune result is a normal 200, so neither the HTTP error metrics nor
 * `degraded_upstream_responses_total` notice it. The `RevenueDataStale` rule
 * in `infra/monitoring/alerts.yml` alerts on this gauge; rename either side
 * and the alert goes silent. A query appears once this process has fetched it.
 */
export const revenueDataAgeSeconds: ObservableGauge =
  meter.createObservableGauge("revenue_data_age_seconds", {
    description:
      "Seconds since the upstream execution behind each revenue query's served rows finished",
  });
revenueDataAgeSeconds.addCallback((result) => {
  for (const { query, ageSeconds } of revenueDataAges()) {
    result.observe(ageSeconds, { query });
  }
});
