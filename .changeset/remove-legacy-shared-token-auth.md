---
"@anticapture/gateful": minor
"@anticapture/client": patch
---

Remove the transitional single shared-token auth path now that per-tenant Authful auth is fully rolled out. Gateful drops the legacy `BLOCKFUL_API_TOKEN` `bearerAuth` fallback (and the `BLOCKFUL_API_TOKEN` env var it read); per-tenant token auth via `TOKEN_SERVICE_URL` is the only auth mode. The `@anticapture/client` package drops an orphaned, never-imported `AuthfulClient` (MCP token validation is delegated to Gateful, not performed in-process).
