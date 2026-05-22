---
"@anticapture/gateful": patch
"@anticapture/api-gateway": patch
---

Adjust gateful's per-DAO health proxy to fetch `/health/full` upstream now that
the API's `/health` is a minimal liveness probe; the public `/{dao}/health`
contract on gateful is unchanged. Also blocks `/health/full` from the
aggregated OpenAPI spec so it isn't merged in as `/{dao}/health/full`.
