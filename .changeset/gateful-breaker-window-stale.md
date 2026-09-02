---
"@anticapture/gateful": patch
---

Circuit breakers now open on a windowed failure rate per DAO route (CIRCUIT_BREAKER_WINDOW_MS, MIN_REQUESTS, FAILURE_RATE
replace FAILURE_THRESHOLD; cooldown 30s), and the Redis cache serves stale entries when the upstream fails.
