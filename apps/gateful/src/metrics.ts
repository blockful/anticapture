import { meterProvider } from "./instrumentation.js";

const meter = meterProvider.getMeter("anticapture-gateful");

export const cacheRequestTotal = meter.createCounter("cache_requests_total", {
  description:
    "Total number of cache lookups, labelled by result (hit/miss) and route",
});

export const tenantRequestTotal = meter.createCounter("tenant_requests_total", {
  description:
    "Authenticated requests, labelled by tenant, token name, and normalized route",
});

export const circuitBreakerState = meter.createGauge("circuit_breaker_state", {
  description:
    "Current Gateful upstream circuit-breaker state: 0=CLOSED, 1=HALF_OPEN, 2=OPEN",
});

export const httpRequestDuration = meter.createHistogram(
  "http_server_request_duration_seconds",
  {
    description: "Duration of HTTP requests in seconds",
    advice: {
      explicitBucketBoundaries: [
        0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
      ],
    },
  },
);
