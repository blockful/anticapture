---
"@anticapture/gateful": patch
---

Circuit breakers open per DAO route on a windowed failure rate, tunable via the `CIRCUIT_BREAKER_*` variables in apps/gateful/src/config.ts, with route keys derived from the path and separate keys for fan-out and health probes, whose circuits are no longer reported in the DAO health summary.
The Redis cache serves stale entries when the upstream fails, and each lookup is counted once.
