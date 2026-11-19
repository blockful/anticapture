---
"@anticapture/api": minor
"@anticapture/gateful": minor
---

Every /revenue/\* response now carries `meta { asOf, degraded }` (OpenAPI component `RevenueMeta`): `asOf` is when the Dune execution behind the rows finished, and `degraded` marks a stale copy, an empty fallback after a Dune failure, or a missing Dune key. Degraded revenue responses are sent with `Cache-Control: no-store` instead of being cached for 60 seconds, a Dune 402 (billing limit) on a result read degrades instead of answering 502, and a `revenue_data_age_seconds` gauge backs a new `RevenueDataStale` alert for revenue data older than 36 hours. `degraded` covers the API's own fallbacks only: when gateful serves an expired cache entry after an API 5xx (stale-on-error), the body keeps its original meta and the copy is marked by `Cache-Status: Redis; stale`.
