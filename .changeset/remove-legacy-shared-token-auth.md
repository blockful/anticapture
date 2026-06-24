---
"@anticapture/gateful": minor
"@anticapture/client": patch
---

Remove the transitional single shared-token auth path now that per-tenant Authful auth is fully rolled out, and protect the public `/metrics` endpoint.

- Gateful drops the legacy `BLOCKFUL_API_TOKEN` `bearerAuth` fallback (and the env var it read); per-tenant token auth via `TOKEN_SERVICE_URL` is the only auth mode.
- The Prometheus `/metrics` endpoint can now be guarded by a shared bearer token via the new optional `GATEFUL_METRICS_TOKEN` env var (set it on the public deployment; left open when unset for local dev). The Prometheus scraper reads the same variable name so it can be wired as a single shared Railway variable. This is independent of per-tenant auth so scrapes never consume a tenant token or appear in per-tenant usage metrics.
- The `@anticapture/client` package drops an orphaned, never-imported `AuthfulClient` (MCP token validation is delegated to Gateful, not performed in-process).
