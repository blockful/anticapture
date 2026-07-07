---
"@anticapture/gateful": minor
"@anticapture/authful": minor
---

Support unbounded (rate-limit-exempt) tokens. A token with `rateLimitPerMin` set to `0` (the sentinel for any non-positive value) is now skipped entirely by Gateful's rate-limit middleware — it never touches Redis and is never throttled. Authful's mint endpoint accepts `0` accordingly (`rateLimitPerMin` validation relaxed from positive to non-negative).
