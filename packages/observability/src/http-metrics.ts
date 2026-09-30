import {
  metrics,
  type Attributes,
  type Histogram,
  type Meter,
} from "@opentelemetry/api";

/**
 * The one HTTP server histogram every Anticapture service exposes. The
 * Prometheus alerts (HighLatency, HighErrorRate) and the Grafana dashboard
 * query this exact name and these labels, so a service that records it is
 * covered by them with no rule change.
 */
export const HTTP_SERVER_REQUEST_DURATION_NAME =
  "http_server_request_duration_seconds";

export const HTTP_SERVER_REQUEST_DURATION_BUCKETS = [
  0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
];

export interface HttpServerRequestSample {
  method: string;
  /** Route pattern (e.g. `/users/:id`), never the raw URL, to bound cardinality. */
  route: string;
  statusCode: number;
  durationSeconds: number;
  /** Extra labels a service wants on top of the standard ones (e.g. client_source). */
  attributes?: Attributes;
}

export interface HttpServerMetrics {
  histogram: Histogram;
  record: (sample: HttpServerRequestSample) => void;
}

export function createHttpServerRequestDuration(meter: Meter): Histogram {
  return meter.createHistogram(HTTP_SERVER_REQUEST_DURATION_NAME, {
    description: "Duration of HTTP requests in seconds",
    advice: { explicitBucketBoundaries: HTTP_SERVER_REQUEST_DURATION_BUCKETS },
  });
}

/**
 * Framework-agnostic recorder for the standard HTTP server histogram. Call it
 * after the global meter provider is set (createObservabilityProvider does
 * that), otherwise the histogram binds to the no-op meter.
 */
export function createHttpServerMetrics(
  meter: Meter = metrics.getMeter("http-server"),
): HttpServerMetrics {
  const histogram = createHttpServerRequestDuration(meter);

  return {
    histogram,
    record: ({ method, route, statusCode, durationSeconds, attributes }) => {
      histogram.record(durationSeconds, {
        ...attributes,
        http_request_method: method,
        http_route: route,
        http_response_status_code: statusCode,
      });
    },
  };
}
