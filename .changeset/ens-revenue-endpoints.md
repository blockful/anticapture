---
"@anticapture/api": minor
---

Add ENS-only `/revenue/*` endpoints backed by Dune.

Introduces a `RevenueDuneClient` (with a per-query 24h in-memory cache) plus
an `ensOnly` Hono middleware. Adds the shared query schema, date-parsing and
range-filter utilities, and the env vars (`REVENUE_DUNE_API_KEY` and one
`REVENUE_DUNE_*_URL` per Dune query) used by the eight upcoming routes:
`/revenue/actions`, `/revenue/active-names`, `/revenue/new-wallets`,
`/revenue/premium-eth`, `/revenue/renewal-funnel`, `/revenue/totals`,
`/revenue/by-account`, `/revenue/renewal-tenure`.

The client is only instantiated when `DAO_ID=ENS`. Routes will be wired in
subsequent stories. All endpoints are gated by `ensOnly`, return 404 for any
non-ENS deployment, and serve responses with `Cache-Control: public, max-age=60`.
