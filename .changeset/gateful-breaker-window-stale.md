---
"@anticapture/gateful": patch
---

Circuit breakers open per DAO route on a windowed failure rate (CIRCUIT_BREAKER_WINDOW_MS, MIN_REQUESTS, FAILURE_RATE, CONSECUTIVE_FAILURES), with route keys derived from the path and separate keys for fan-out and health probes, whose circuits are no longer reported in the DAO health summary.
The Redis cache serves stale entries when the upstream fails.
