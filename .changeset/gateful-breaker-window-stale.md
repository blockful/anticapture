---
"@anticapture/gateful": patch
---

Circuit breakers now open on a windowed failure rate per DAO route (CIRCUIT_BREAKER_WINDOW_MS, MIN_REQUESTS, FAILURE_RATE
replace FAILURE_THRESHOLD; cooldown 30s), with CIRCUIT_BREAKER_CONSECUTIVE_FAILURES as the trip rule for quiet upstreams.
Route breakers are derived from the request path (no route list to maintain) and shared by the proxy, fan-out and health
probes. The Redis cache serves stale entries when the upstream fails.
