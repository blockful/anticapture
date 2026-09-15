---
"@anticapture/dashboard": patch
---

Stop retrying failed HTTP requests in React Query (retry network errors once): each retry against a failing
route counted toward the gateway circuit breaker, so one page view could take a DAO offline.
