import { metrics } from "@opentelemetry/api";
import type { Counter, Histogram } from "@opentelemetry/api";

export { exporter, meterProvider } from "@/instrumentation";

const meter = metrics.getMeter("anticapture-api");

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

export const cacheHits: Counter = meter.createCounter("cache_hits_total", {
  description: "Total number of cache hits",
});

export const cacheMisses: Counter = meter.createCounter("cache_misses_total", {
  description: "Total number of cache misses",
});
