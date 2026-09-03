---
"@anticapture/api": patch
---

Push the `lean` query param down to SQL for `GET /proposals/search` and `GET /proposals/{id}`, so description/calldatas/values/targets are no longer selected just to be dropped by the mapper. Response shape is unchanged.
