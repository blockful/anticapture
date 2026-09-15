---
"@anticapture/gateful": patch
---

Forward the relayer's own error responses (e.g. `503 RELAYER_LOW_BALANCE`, `{ code, message }`) to clients instead of
replacing them with a generic 500, and stop counting them as circuit-breaker failures: the relayer answered, it is not down.
