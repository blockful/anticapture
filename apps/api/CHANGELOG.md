# @anticapture/api

## 1.3.1

### Patch Changes

- [#1956](https://github.com/blockful/anticapture/pull/1956) [`18aef34`](https://github.com/blockful/anticapture/commit/18aef3474e8e69ce9162d0ab67a68bf90809bc3d) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Model the onchain proposals response (`/proposals`, `/proposals/search`, `/proposals/{id}`) as a `variant`-tagged discriminated union. When `lean=true` the API returns the `lean` variant (omitting calldatas/values/targets and the proposal description to reduce payload size); otherwise it returns the `full` variant. Clients can narrow on the `variant` discriminator for exact typing instead of guarding optional fields.

## 1.3.0

### Minor Changes

- [#1913](https://github.com/blockful/anticapture/pull/1913) [`156219e`](https://github.com/blockful/anticapture/commit/156219eb109011237bd2957332f092e98ec48cde) Thanks [@pikonha](https://github.com/pikonha)! - Add server-side `from` and `to` query parameters to `GET /accounts/{address}/balances/historical`. The dashboard's balance history now applies the buy/sell and custom address filters in the query (regenerated client surfaces them) so `totalCount`, pagination, and the first-page contents reflect the filtered set instead of being filtered after fetching. Fixes empty/incomplete filtered pages when matches live on later pages of the unfiltered dataset.

### Patch Changes

- [#1944](https://github.com/blockful/anticapture/pull/1944) [`8978c4f`](https://github.com/blockful/anticapture/commit/8978c4f4d0b7a638486de6c80b578b8f5fb1f98f) Thanks [@pikonha](https://github.com/pikonha)! - Fix token holders pagination duplicating rows (wire the shared `getNextPageParam` into `useAccountBalancesInfinite`), unify `getHistoricalBalanceCount` on a single joined query so totals match returned items, memoize delegator dedup, anchor account-interactions `totalCount` to the first page, drop the redundant `fetchNextPageStable` wrapper in `useDelegates`, and document the single-page `limit: 1000` truncation in the balance-history and delegate-delegation-history graph hooks.

## 1.2.0

### Minor Changes

- [#1888](https://github.com/blockful/anticapture/pull/1888) [`ab313ce`](https://github.com/blockful/anticapture/commit/ab313ceba1e1eed357d9548003819b225d45a7c2) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Split `/health` into a Railway-friendly liveness probe and a richer diagnostic
  endpoint.

  `GET /health` now returns only `{database: "ok" | "error"}` with HTTP `200` when
  the database is reachable and `503` otherwise — designed for orchestrators
  (Railway, k8s) that act on status codes alone. The full snapshot, including
  chain head and indexer freshness (`status`, `chain.head`, `indexer.*`), moved
  to `GET /health/full`. HTTP status on `/health/full` still tracks database
  reachability only; a stale indexer surfaces as `status: "degraded"` with `200`.

  Also locks in the existing `Number(raw)` coercion in
  `HealthRepositoryImpl.getLastEventTimestamp` with a regression test, so the
  indexer timestamp can never leak as a bigint-stringified value into the
  response and break downstream schema validation.

- [#1875](https://github.com/blockful/anticapture/pull/1875) [`cb90c89`](https://github.com/blockful/anticapture/commit/cb90c8941e32c352ef84eb3b3e45298c1233f4ff) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Migrate feed event metadata from a denormalized `feed_event.metadata` JSON column to query-time synthesis against `proposals_onchain`, `votes_onchain`, `delegations`, `transfers`, and `voting_power_history`. Adds discriminated metadata schemas to the OpenAPI contract, supports multi-type filtering on `/feed/events`, and wires the dashboard event-type filter as a multi-select.

- [#1888](https://github.com/blockful/anticapture/pull/1888) [`ac56ee9`](https://github.com/blockful/anticapture/commit/ac56ee949df21ebd7bb0789f2571468b2452ab96) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Replace the dedicated lean proposal endpoints with a `lean` query param.

  The six `/proposals/lean*` and `/offchain/proposals/lean*` routes are removed.
  Pass `lean=true` on the existing routes instead — `GET /{dao}/proposals`,
  `/proposals/search`, `/proposals/{id}`, `/offchain/proposals`,
  `/offchain/proposals/search`, and `/offchain/proposals/{id}` all now accept
  the flag and drop the heavy fields (`calldatas`/`values`/`targets` on
  onchain, `body` on offchain) when set. The default remains the full payload
  so existing clients see no behavior change.

  The `OnchainProposal.calldatas/values/targets` and `OffchainProposal.body`
  fields are now optional in the OpenAPI schema, reflecting the runtime
  contract more truthfully than before.

  The new `lean` param uses explicit string parsing (`true`/`false`/`1`/`0`)
  rather than `z.coerce.boolean()`, so `?lean=false` and `?lean=0` resolve to
  `false` instead of being coerced to truthy by JavaScript's `Boolean(...)`.

### Patch Changes

- [#1888](https://github.com/blockful/anticapture/pull/1888) [`298cc75`](https://github.com/blockful/anticapture/commit/298cc755cd5d62658d5f97294a61c3c66d886362) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Stop capping the delegation-percentage repository read at `(limit + 1) * 2`.
  The service builds a forward-filled timeline across the full requested date
  window and only then paginates with `skip`/`limit`. Capping the upstream
  read would drop later metric changes, freezing stale values across the tail
  of the timeline and returning incorrect data on later `skip` pages.

- [#1888](https://github.com/blockful/anticapture/pull/1888) [`298cc75`](https://github.com/blockful/anticapture/commit/298cc755cd5d62658d5f97294a61c3c66d886362) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Drop the `format: "bigint"` annotation from `percentageChange` on
  `AccountBalanceVariation` and `VotingPowerVariation`. The field carries a
  decimal-string percentage (or the `"NO BASELINE"` sentinel when the previous
  period is zero) — it was never a bigint, and the wrong tag made generated
  TS clients type it as `bigint`, which broke sentinel comparisons downstream.

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
