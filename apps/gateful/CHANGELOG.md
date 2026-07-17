# @anticapture/gateful

## 1.3.1

### Patch Changes

- [#2055](https://github.com/blockful/anticapture/pull/2055) [`248a451`](https://github.com/blockful/anticapture/commit/248a4518fd7d22c24ceaa23ad4692e1a5cb18aa6) Thanks [@pikonha](https://github.com/pikonha)! - Make request log messages human-readable in Loki (`GET /path 200` instead of `request`) and stop logging `/metrics` and `/health` scrapes

## 1.3.0

### Minor Changes

- [#2032](https://github.com/blockful/anticapture/pull/2032) [`f1fc962`](https://github.com/blockful/anticapture/commit/f1fc9620f8d64822d8d357607b68fd3ee183b40c) Thanks [@pikonha](https://github.com/pikonha)! - Expose token names in Authful validation responses so Gateful usage metrics can count requests by tenant, token name, and route. Add Authful validation counters and Gateful circuit-breaker state metrics for monitoring dashboards.

- [#2022](https://github.com/blockful/anticapture/pull/2022) [`df56c8d`](https://github.com/blockful/anticapture/commit/df56c8db37a08a3669449fc10ac65a465fb2298a) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Support unbounded (rate-limit-exempt) tokens. A token with `rateLimitPerMin` set to `0` (the sentinel for any non-positive value) is now skipped entirely by Gateful's rate-limit middleware — it never touches Redis and is never throttled. Authful's mint endpoint accepts `0` accordingly (`rateLimitPerMin` validation relaxed from positive to non-negative).

## 1.2.0

### Minor Changes

- [#1971](https://github.com/blockful/anticapture/pull/1971) [`4a85cf4`](https://github.com/blockful/anticapture/commit/4a85cf47d6a56b3f0c9de5da87978e0687755c55) Thanks [@brunod-e](https://github.com/brunod-e)! - Per-tenant API tokens (DEV-758): new Authful service issues, validates and revokes tenant tokens (sha256-only storage, manual minting); Gateful gains an optional token-auth middleware with Redis-cached validation, per-token rate limiting and per-tenant request metrics exposed on its `/metrics` endpoint (Prometheus counter `tenant_requests_total{tenant, route}`), enabled via `TOKEN_SERVICE_URL` (legacy `BLOCKFUL_API_TOKEN` behavior unchanged when unset). The MCP server can forward the caller's `Authorization` header to Gateful via `FORWARD_CLIENT_AUTH=true`; in that mode the shared `ANTICAPTURE_API_KEY` is never attached, so unauthenticated requests get a per-tenant 401 instead of riding the shared key.

- [#1995](https://github.com/blockful/anticapture/pull/1995) [`4d7d667`](https://github.com/blockful/anticapture/commit/4d7d66701fcefb8a1b3af2a41dd2c4af9b77862a) Thanks [@pikonha](https://github.com/pikonha)! - Gateful `/health` now returns 503 unless every configured DAO API, relayer, and address-enrichment service responds on `/health`.

- [#1996](https://github.com/blockful/anticapture/pull/1996) [`f5b9f24`](https://github.com/blockful/anticapture/commit/f5b9f24d0a7c7081ec80b58cc45cc35eb3b29ae3) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Protect the public `/metrics` endpoint with a bearer token. When the optional `GATEFUL_METRICS_TOKEN` env var is set, scrapes of `/metrics` must present it as a bearer (constant-time compare; 401 otherwise); left open when unset for local dev. The Prometheus scraper reads the same variable name so it can be wired as a single shared Railway variable. This guard is independent of per-tenant Authful auth, so scrapes never consume a tenant token or appear in per-tenant usage metrics.

- [#1994](https://github.com/blockful/anticapture/pull/1994) [`d94129c`](https://github.com/blockful/anticapture/commit/d94129ca6d9d488689f7ada91db4d1c7c8020394) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Remove the transitional single shared-token auth path now that per-tenant Authful auth is fully rolled out. Gateful drops the legacy `BLOCKFUL_API_TOKEN` `bearerAuth` fallback (and the `BLOCKFUL_API_TOKEN` env var it read); per-tenant token auth via `TOKEN_SERVICE_URL` is the only auth mode. The `@anticapture/client` package drops an orphaned, never-imported `AuthfulClient` (MCP token validation is delegated to Gateful, not performed in-process).

### Patch Changes

- [#1971](https://github.com/blockful/anticapture/pull/1971) [`51e110a`](https://github.com/blockful/anticapture/commit/51e110a12820493c453097fc069b194f0b8c08e5) Thanks [@brunod-e](https://github.com/brunod-e)! - Standardize environment-variable handling to match the API module. The MCP server now loads `.env` via dotenv and validates `PORT`, `HOST`, `ANTICAPTURE_API_URL`, `ANTICAPTURE_API_KEY`, and `FORWARD_CLIENT_AUTH` through a single zod schema instead of ad-hoc `process.env` reads. Authful's env parsing switches to the same `safeParse` + friendly-error pattern and folds `TOKEN_PLAINTEXT` into the schema so the mint script no longer reads `process.env` directly. Gateful now normalizes `TOKEN_SERVICE_URL` (trailing-slash trimming) in its zod env schema rather than manually inside `AuthfulClient`.

- [#1995](https://github.com/blockful/anticapture/pull/1995) [`69c4427`](https://github.com/blockful/anticapture/commit/69c44279b1e1220b65a11c7aaf972f39544360c6) Thanks [@pikonha](https://github.com/pikonha)! - Gateful `/health` probes are now read-only: they reflect each upstream's circuit-breaker state but no longer run through `breaker.execute()`, so CI/orchestrator polling can't trip the real-traffic circuit (or steal its HALF_OPEN probe slot) and take routes offline.

## 1.1.0

### Minor Changes

- [#1976](https://github.com/blockful/anticapture/pull/1976) [`4e5f06a`](https://github.com/blockful/anticapture/commit/4e5f06a261211b9a94eb0e40047468000ba40363) Thanks [@LeonardoVieira1630](https://github.com/LeonardoVieira1630)! - Switch relayer rate limiting from a shared daily window to per-operation monthly limits (separate caps for votes and delegations), configurable via `MAX_VOTES_PER_ADDRESS_PER_MONTH` and `MAX_DELEGATIONS_PER_ADDRESS_PER_MONTH` (each defaulting to 3). The `/relay/config` and `/relay/rate-limit/{address}` responses now expose per-operation `limits`/`limit` and a monthly `resetsAt`; the client SDK is regenerated to match. The dashboard `useGaslessRelayer` hook now exposes `voteLimit`/`delegationLimit` in place of the removed `maxRelayPerAddressPerDay`/`maxPerDay` fields.

- [#1950](https://github.com/blockful/anticapture/pull/1950) [`05a7cf2`](https://github.com/blockful/anticapture/commit/05a7cf2d7280b392579a342db3810c6e1fa0d54d) Thanks [@pikonha](https://github.com/pikonha)! - Generate the client SDK from the Gateful OpenAPI spec using Railway environment names.

### Patch Changes

- [#1910](https://github.com/blockful/anticapture/pull/1910) [`a006283`](https://github.com/blockful/anticapture/commit/a0062835b784f0b97363c664ab7efb3ee4177171) Thanks [@brunod-e](https://github.com/brunod-e)! - feat(draft-proposals): persist draft proposals in PostgreSQL with SIWE authentication

  Moves draft proposal storage from browser localStorage to the API's PostgreSQL database. Adds SIWE-based JWT authentication endpoints (`GET /auth/nonce`, `POST /auth/verify`) and full CRUD endpoints for draft proposals (`/proposal/drafts`). On wallet connect, existing localStorage drafts are automatically migrated to the database. Drafts are scoped per user address and DAO.

- [#1950](https://github.com/blockful/anticapture/pull/1950) [`02c97be`](https://github.com/blockful/anticapture/commit/02c97be45cecc29b093304288dd375e320856d3f) Thanks [@pikonha](https://github.com/pikonha)! - Protect relayer proxy routes with the same circuit-breaker backoff used for DAO API and address-enrichment upstreams.

- [#1950](https://github.com/blockful/anticapture/pull/1950) [`e240a4e`](https://github.com/blockful/anticapture/commit/e240a4e0e5a420179b66e6e86736500107129857) Thanks [@pikonha](https://github.com/pikonha)! - Protect the address-enrichment proxy route with the circuit breaker, matching the resilience already applied to DAO API requests.

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
    (`GET /aggregations/average-delegation-percentage` in gateful and the
    `averageDelegationPercentageByDay` GraphQL field in api-gateway) and
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
