---
"@anticapture/authful": patch
---

Add project-standard observability to Authful: structured Pino request logging, OpenTelemetry metrics/tracing via `@anticapture/observability`, an HTTP request-duration histogram, and a public `/metrics` Prometheus endpoint. Instrumentation is emitted as its own bundle entry and loaded with `node --import` so it registers before `pg`/`http` are required.
