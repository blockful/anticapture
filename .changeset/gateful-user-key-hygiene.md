---
"@anticapture/gateful": patch
---

Self-service (`user:*`) API keys: usage metrics bucket the per-user tenant label as `user:*` so the Prometheus series set stays bounded, and cached positive token verdicts use a 30s TTL (instead of 300s) so a key revoked from the dashboard stops authenticating within seconds.
