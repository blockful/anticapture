---
"@anticapture/gateful": minor
---

Protect the public `/metrics` endpoint with a bearer token. When the optional `GATEFUL_METRICS_TOKEN` env var is set, scrapes of `/metrics` must present it as a bearer (constant-time compare; 401 otherwise); left open when unset for local dev. The Prometheus scraper reads the same variable name so it can be wired as a single shared Railway variable. This guard is independent of per-tenant Authful auth, so scrapes never consume a tenant token or appear in per-tenant usage metrics.
