---
"@anticapture/observability": minor
---

Add the shared HTTP server metrics helpers: `createHttpServerMetrics` /
`createHttpServerRequestDuration` (framework-agnostic, the standard
`http_server_request_duration_seconds` histogram with the labels the alerts and
dashboard expect) and `registerFastifyMetrics` under
`@anticapture/observability/fastify` (serves `/metrics` and records requests).
Fix `createObservabilityProvider` registering the OpenTelemetry instrumentations
before the global meter provider was set, which made the HTTP
auto-instrumentation record into a no-op meter; `http_server_duration` and
`http_client_duration` are now exported.
