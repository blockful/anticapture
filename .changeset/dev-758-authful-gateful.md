---
"@anticapture/authful": minor
"@anticapture/gateful": minor
"@anticapture/client": minor
---

Per-tenant API tokens (DEV-758): new Authful service issues, validates and revokes tenant tokens (sha256-only storage, manual minting); Gateful gains an optional token-auth middleware with Redis-cached validation, per-token rate limiting and batched usage tracking, enabled via `TOKEN_SERVICE_URL` (legacy `BLOCKFUL_API_TOKEN` behavior unchanged when unset). The MCP server can forward the caller's `Authorization` header to Gateful via `FORWARD_CLIENT_AUTH=true`; in that mode the shared `ANTICAPTURE_API_KEY` is never attached, so unauthenticated requests get a per-tenant 401 instead of riding the shared key.
