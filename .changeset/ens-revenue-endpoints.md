---
"@anticapture/api": minor
---

Add ENS-only `/revenue/*` endpoints backed by Dune.

Introduces a `RevenueDuneClient` (with a per-query 24h in-memory cache and
outbound + cache-hit + error logging) plus an `ensOnly` Hono middleware that
404s any deployment where `env.DAO_ID !== DaoIdEnum.ENS`. Adds the shared
`RevenueQuerySchema` (`fromDate` / `toDate` as Unix seconds via
`unixTimestampQueryParam`, plus `orderDirection`), a `parseDuneMonth` utility,
a `filterByRange` helper, and the env vars (`REVENUE_DUNE_API_KEY` plus one
`REVENUE_DUNE_*_URL` per Dune query) used by the seven routes:

- `GET /revenue/actions` — monthly action counts by category
  (Registration / Renewal / Premium)
- `GET /revenue/active-names` — monthly net change and cumulative count of
  active `.eth` names
- `GET /revenue/new-wallets` — monthly new-wallet counts and cumulative
  wallet total
- `GET /revenue/renewal-funnel` — per-expiry-month terms expiring, renewed,
  churned, and renewal rate
- `GET /revenue/totals` — monthly revenue split into registration / premium /
  renewal in both USD and ETH
- `GET /revenue/by-category` — monthly revenue split by category
  (Registration vs Renewal) in USD and ETH, from the Steakhouse ledger
- `GET /revenue/renewal-tenure` — per-expiry-month name counts in each tenure
  bucket (0 / 1 / 2 / 3+ renewals)

The client is only instantiated when `DAO_ID=ENS` and `REVENUE_DUNE_API_KEY`
is set; otherwise the routes return `{ items: [], totalCount: 0 }` with 200.
All endpoints are gated by `ensOnly` (404 outside ENS) and serve responses
with `Cache-Control: public, max-age=60`. The renewal-tenure endpoint passes
upstream rows through verbatim — including far-future `expiry_month` outliers
— so consumers can decide whether to clip them.
