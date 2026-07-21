---
"@anticapture/authful": minor
"@anticapture/gateful": minor
"@anticapture/user-api": minor
"@anticapture/dashboard": minor
---

Add a user-facing 30-day daily request chart for self-service API keys, backed by resilient Gateful usage batching and tenant-scoped Authful storage. Gateful flushes with a new usage-only Authful credential (`USAGE_API_KEY` / `TOKEN_SERVICE_USAGE_API_KEY`) that can only record usage — the internet-facing edge never holds mint/revoke capability.
