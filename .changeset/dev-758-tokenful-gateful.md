---
"@anticapture/tokenful": minor
"@anticapture/gateful": minor
---

Per-tenant API tokens (DEV-758): new Tokenful service issues, validates and revokes tenant tokens (sha256-only storage, manual minting); Gateful gains an optional token-auth middleware with Redis-cached validation, per-token rate limiting and batched usage tracking, enabled via `TOKEN_SERVICE_URL` (legacy `BLOCKFUL_API_TOKEN` behavior unchanged when unset).
