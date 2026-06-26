---
"@anticapture/gateful": patch
---

Gateful `/health` probes are now read-only: they reflect each upstream's circuit-breaker state but no longer run through `breaker.execute()`, so CI/orchestrator polling can't trip the real-traffic circuit (or steal its HALF_OPEN probe slot) and take routes offline.
