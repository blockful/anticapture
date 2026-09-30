# @anticapture/observability

## 1.1.0

### Minor Changes

- [#2165](https://github.com/blockful/anticapture/pull/2165) [`5c3da3b`](https://github.com/blockful/anticapture/commit/5c3da3b399569ac8046403c46c5264d0802b73c4) Thanks [@LeonardoVieira1630](https://github.com/LeonardoVieira1630)! - Add the shared HTTP server metrics helpers: `createHttpServerMetrics` /
  `createHttpServerRequestDuration` (framework-agnostic, the standard
  `http_server_request_duration_seconds` histogram with the labels the alerts and
  dashboard expect) and `registerFastifyMetrics` under
  `@anticapture/observability/fastify` (serves `/metrics` and records requests).
  Fix `createObservabilityProvider` registering the OpenTelemetry instrumentations
  before the global meter provider was set, which made the HTTP
  auto-instrumentation record into a no-op meter; `http_server_duration` and
  `http_client_duration` are now exported.
