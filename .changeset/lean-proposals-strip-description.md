---
"@anticapture/api": patch
"@anticapture/gateful": patch
"@anticapture/api-gateway": patch
---

Onchain proposals endpoints (`/proposals`, `/proposals/search`, `/proposals/{id}`) now also omit the `description` field when `lean=true`, further reducing payload size.
