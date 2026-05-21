# @anticapture/api

## 1.1.0

### Minor Changes

- [#1892](https://github.com/blockful/anticapture/pull/1892) [`35d2bb6`](https://github.com/blockful/anticapture/commit/35d2bb683b8431f25e9d4e47f8d18cd253b0e6ba) Thanks [@brunod-e](https://github.com/brunod-e)! - Add ENS-only `/revenue/*` endpoints backed by Dune.

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

### Patch Changes

- [#1922](https://github.com/blockful/anticapture/pull/1922) [`e246752`](https://github.com/blockful/anticapture/commit/e24675287a69e785152f8bf317556bfc8c71c169) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Harden ENS revenue Dune env validation and switch URL config to query IDs.

  `REVENUE_DUNE_*_URL` env vars are replaced with `REVENUE_DUNE_*_QUERY_ID` (numeric Dune query IDs); the API now interpolates them into `https://api.dune.com/api/v1/query/{ID}/results`. All seven IDs are required when `REVENUE_DUNE_API_KEY` is set, so a partial-env typo fails fast at startup instead of returning 503s from `/revenue/*` at request time.
