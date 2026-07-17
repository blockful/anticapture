---
"@anticapture/authful": patch
---

Self-service (`user:*`) API keys: the internal token validation metric buckets the per-user tenant label as `user:*` so the Prometheus series set stays bounded, matching Gateful's usage metric.
