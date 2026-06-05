# @anticapture/gateful

## 1.0.5

### Patch Changes

- [#1960](https://github.com/blockful/anticapture/pull/1960) [`672bfd2`](https://github.com/blockful/anticapture/commit/672bfd29fdabeca0d22f603a49cb5cb1286b81df) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Fix and enhance OpenAPI docstrings on REST controllers: correct the "a the" grammar in the account-balance and voting-power variations descriptions, fix the `GET /proposals` 200 response description that mislabeled the payload as "proposals activity", and add missing endpoint descriptions across governance-activity, token-distribution, delegation-percentage, event-relevance, feed, last-update, and the gateful daos/health/average-delegation routes.

## 1.0.4

### Patch Changes

- [#1947](https://github.com/blockful/anticapture/pull/1947) [`8ffc325`](https://github.com/blockful/anticapture/commit/8ffc325c76ac3e107c4ece43c9b93c828f3aa8ce) Thanks [@pikonha](https://github.com/pikonha)! - token distribution fetching lean proposals

- [#1947](https://github.com/blockful/anticapture/pull/1947) [`e98cab2`](https://github.com/blockful/anticapture/commit/e98cab279ea8fbf38c1a924d1853d79e36ac47da) Thanks [@pikonha](https://github.com/pikonha)! - Add lean parameter support to proposals endpoints for sitemap generation

- [#1956](https://github.com/blockful/anticapture/pull/1956) [`18aef34`](https://github.com/blockful/anticapture/commit/18aef3474e8e69ce9162d0ab67a68bf90809bc3d) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Model the onchain proposals response (`/proposals`, `/proposals/search`, `/proposals/{id}`) as a `variant`-tagged discriminated union. When `lean=true` the API returns the `lean` variant (omitting calldatas/values/targets and the proposal description to reduce payload size); otherwise it returns the `full` variant. Clients can narrow on the `variant` discriminator for exact typing instead of guarding optional fields.

## 1.0.3

### Patch Changes

- [#1913](https://github.com/blockful/anticapture/pull/1913) [`156219e`](https://github.com/blockful/anticapture/commit/156219eb109011237bd2957332f092e98ec48cde) Thanks [@pikonha](https://github.com/pikonha)! - Add server-side `from` and `to` query parameters to `GET /accounts/{address}/balances/historical`. The dashboard's balance history now applies the buy/sell and custom address filters in the query (regenerated client surfaces them) so `totalCount`, pagination, and the first-page contents reflect the filtered set instead of being filtered after fetching. Fixes empty/incomplete filtered pages when matches live on later pages of the unfiltered dataset.

## 1.0.2

### Patch Changes

- [#1888](https://github.com/blockful/anticapture/pull/1888) [`298cc75`](https://github.com/blockful/anticapture/commit/298cc755cd5d62658d5f97294a61c3c66d886362) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Migrate the average-delegation aggregators to the new DAO API pagination
  contract.
  - Stop reading `pageInfo` from the upstream `/delegation-percentage`
    response. Both aggregators now derive `hasNextPage` from
    `items.length < totalCount` per DAO. The public `pageInfo` on the
    aggregated response is unchanged.
  - Drop the `after`/`before` cursor params from the aggregator routes
    (`GET /aggregations/average-delegation-percentage` in gateful and
    switch to a `skip` integer that matches the DAO API. The aggregators no
    longer forward stale cursor params to upstream, so requests for later
    pages now actually advance instead of repeating the first slice.
    `pageInfo.hasPreviousPage` is now derived from `skip > 0`.

- [#1888](https://github.com/blockful/anticapture/pull/1888) [`ab313ce`](https://github.com/blockful/anticapture/commit/ab313ceba1e1eed357d9548003819b225d45a7c2) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Adjust gateful's per-DAO health proxy to fetch `/health/full` upstream now that
  the API's `/health` is a minimal liveness probe; the public `/{dao}/health`
  contract on gateful is unchanged. Also blocks `/health/full` from the
  aggregated OpenAPI spec so it isn't merged in as `/{dao}/health/full`.

- [#1875](https://github.com/blockful/anticapture/pull/1875) [`cb90c89`](https://github.com/blockful/anticapture/commit/cb90c8941e32c352ef84eb3b3e45298c1233f4ff) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Migrate feed event metadata from a denormalized `feed_event.metadata` JSON column to query-time synthesis against `proposals_onchain`, `votes_onchain`, `delegations`, `transfers`, and `voting_power_history`. Adds discriminated metadata schemas to the OpenAPI contract, supports multi-type filtering on `/feed/events`, and wires the dashboard event-type filter as a multi-select.

- [#1888](https://github.com/blockful/anticapture/pull/1888) [`298cc75`](https://github.com/blockful/anticapture/commit/298cc755cd5d62658d5f97294a61c3c66d886362) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Regenerate API contracts to pick up the corrected `percentageChange` type
  (plain string, no bigint format) on `AccountBalanceVariation` and
  `VotingPowerVariation`.

- [#1888](https://github.com/blockful/anticapture/pull/1888) [`ac56ee9`](https://github.com/blockful/anticapture/commit/ac56ee949df21ebd7bb0789f2571468b2452ab96) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Regenerate API contracts to drop the lean proposal endpoints and pick up the
  `lean` query param + optional execution-payload / body fields exposed by
  `@anticapture/api`.

## 1.0.1

### Patch Changes

- [#1919](https://github.com/blockful/anticapture/pull/1919) [`8c1abdf`](https://github.com/blockful/anticapture/commit/8c1abdf1294f28ffe686823b6db44ca5454e0b45) Thanks [@pikonha](https://github.com/pikonha)! - Regenerate API contracts to pick up ENS `/revenue/*` endpoints from `@anticapture/api`.
