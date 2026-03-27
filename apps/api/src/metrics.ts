import type { Counter, Histogram } from "@opentelemetry/api";

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
