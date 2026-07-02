# @anticapture/client

## 1.4.0

### Minor Changes

- [#1971](https://github.com/blockful/anticapture/pull/1971) [`4a85cf4`](https://github.com/blockful/anticapture/commit/4a85cf47d6a56b3f0c9de5da87978e0687755c55) Thanks [@brunod-e](https://github.com/brunod-e)! - Per-tenant API tokens (DEV-758): new Authful service issues, validates and revokes tenant tokens (sha256-only storage, manual minting); Gateful gains an optional token-auth middleware with Redis-cached validation, per-token rate limiting and per-tenant request metrics exposed on its `/metrics` endpoint (Prometheus counter `tenant_requests_total{tenant, route}`), enabled via `TOKEN_SERVICE_URL` (legacy `BLOCKFUL_API_TOKEN` behavior unchanged when unset). The MCP server can forward the caller's `Authorization` header to Gateful via `FORWARD_CLIENT_AUTH=true`; in that mode the shared `ANTICAPTURE_API_KEY` is never attached, so unauthenticated requests get a per-tenant 401 instead of riding the shared key.

- [#1971](https://github.com/blockful/anticapture/pull/1971) [`e57bf06`](https://github.com/blockful/anticapture/commit/e57bf06b022728ccb9bb32f6c2622125c3d2a506) Thanks [@brunod-e](https://github.com/brunod-e)! - MCP server can now forward each caller's own Authorization header to the upstream Gateful API (enable with `FORWARD_CLIENT_AUTH=true`), laying the groundwork for per-tenant tokens with rate limiting and usage tracking. Disabled by default; existing shared-key behavior is unchanged.

- [#1993](https://github.com/blockful/anticapture/pull/1993) [`add9bd1`](https://github.com/blockful/anticapture/commit/add9bd1e96ea89dd26f892fcd30353919d905126) Thanks [@caveman-eth](https://github.com/caveman-eth)! - Surface ENS social records and EFP stats for addresses.
  - `address-enrichment` now reads the EFP `/details` endpoint, capturing the ENS `com.twitter`, `org.telegram`, `email`, and `com.github` text records plus EFP follower/following counts. These are exposed under `ens` (socials) and a new `efp` object, cached under the existing ENS TTL. EFP counts are returned even when the address has no primary ENS name.
  - The Holders & Delegates drawer header now shows follower/following counts (linked to the EFP profile) and social links (X, Telegram, GitHub, email) for the selected address.

- [#1971](https://github.com/blockful/anticapture/pull/1971) [`2dea74c`](https://github.com/blockful/anticapture/commit/2dea74c32a99f8475894df6b2e59e759ecaf233a) Thanks [@brunod-e](https://github.com/brunod-e)! - The MCP HTTP server no longer does an equality check against the shared `ANTICAPTURE_MCP_API_KEY` (now removed). Token validation is delegated to Gateful: callers present their own per-tenant token, which the MCP server forwards upstream (`FORWARD_CLIENT_AUTH=true`) for Gateful's `tokenAuthMiddleware` to validate and attribute per tenant. Validation is intentionally not duplicated at the MCP layer — Gateful owns it, including the Redis cache and fail-open fallback that keep cache-warm tenants serving through an Authful restart.

### Patch Changes

- [#1971](https://github.com/blockful/anticapture/pull/1971) [`51e110a`](https://github.com/blockful/anticapture/commit/51e110a12820493c453097fc069b194f0b8c08e5) Thanks [@brunod-e](https://github.com/brunod-e)! - Standardize environment-variable handling to match the API module. The MCP server now loads `.env` via dotenv and validates `PORT`, `HOST`, `ANTICAPTURE_API_URL`, `ANTICAPTURE_API_KEY`, and `FORWARD_CLIENT_AUTH` through a single zod schema instead of ad-hoc `process.env` reads. Authful's env parsing switches to the same `safeParse` + friendly-error pattern and folds `TOKEN_PLAINTEXT` into the schema so the mint script no longer reads `process.env` directly. Gateful now normalizes `TOKEN_SERVICE_URL` (trailing-slash trimming) in its zod env schema rather than manually inside `AuthfulClient`.

- [#1995](https://github.com/blockful/anticapture/pull/1995) [`172558c`](https://github.com/blockful/anticapture/commit/172558c1b1284c085b68a8cd8316a7fb023d287f) Thanks [@pikonha](https://github.com/pikonha)! - Resolve the Gateful OpenAPI spec from the matching PR-preview Gateful on Vercel previews (derived from `VERCEL_GIT_PULL_REQUEST_ID`), so codegen-dependent builds (e.g. dashboard/storybook) no longer fail with "Config failed loading" when neither `ANTICAPTURE_API_URL` nor `RAILWAY_ENVIRONMENT_NAME` is set.

- [#1995](https://github.com/blockful/anticapture/pull/1995) [`eaacf28`](https://github.com/blockful/anticapture/commit/eaacf28668967881c626e673f70af43de4233f74) Thanks [@pikonha](https://github.com/pikonha)! - Drop the shared-dev-Gateful fallback for untrusted/fork Vercel PR previews. Those previews get no PR-scoped Railway service, so they can never reflect a PR's API/Gateful changes — pointing them at `dev-gateful` only produced a misleading preview. The dashboard `next.config.ts` and the `@anticapture/client` Gateful OpenAPI spec resolver now rely solely on an explicit `ANTICAPTURE_API_URL` (injected by CI for trusted PRs / set on dev & production) or a Railway PR-preview environment; anything else throws instead of silently falling back.

- [#1994](https://github.com/blockful/anticapture/pull/1994) [`d94129c`](https://github.com/blockful/anticapture/commit/d94129ca6d9d488689f7ada91db4d1c7c8020394) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Remove the transitional single shared-token auth path now that per-tenant Authful auth is fully rolled out. Gateful drops the legacy `BLOCKFUL_API_TOKEN` `bearerAuth` fallback (and the `BLOCKFUL_API_TOKEN` env var it read); per-tenant token auth via `TOKEN_SERVICE_URL` is the only auth mode. The `@anticapture/client` package drops an orphaned, never-imported `AuthfulClient` (MCP token validation is delegated to Gateful, not performed in-process).

## 1.3.0

### Minor Changes

- [#1976](https://github.com/blockful/anticapture/pull/1976) [`4e5f06a`](https://github.com/blockful/anticapture/commit/4e5f06a261211b9a94eb0e40047468000ba40363) Thanks [@LeonardoVieira1630](https://github.com/LeonardoVieira1630)! - Switch relayer rate limiting from a shared daily window to per-operation monthly limits (separate caps for votes and delegations), configurable via `MAX_VOTES_PER_ADDRESS_PER_MONTH` and `MAX_DELEGATIONS_PER_ADDRESS_PER_MONTH` (each defaulting to 3). The `/relay/config` and `/relay/rate-limit/{address}` responses now expose per-operation `limits`/`limit` and a monthly `resetsAt`; the client SDK is regenerated to match. The dashboard `useGaslessRelayer` hook now exposes `voteLimit`/`delegationLimit` in place of the removed `maxRelayPerAddressPerDay`/`maxPerDay` fields.

- [#1950](https://github.com/blockful/anticapture/pull/1950) [`05a7cf2`](https://github.com/blockful/anticapture/commit/05a7cf2d7280b392579a342db3810c6e1fa0d54d) Thanks [@pikonha](https://github.com/pikonha)! - Generate the client SDK from the Gateful OpenAPI spec using Railway environment names.

### Patch Changes

- [#1970](https://github.com/blockful/anticapture/pull/1970) [`e5840e8`](https://github.com/blockful/anticapture/commit/e5840e89b2aa2d9090078a3fcbb5ba856caa65e6) Thanks [@pikonha](https://github.com/pikonha)! - Re-run client codegen whenever `apps/api` or `apps/gateful` change. Because the SDK is generated from the live Gateful spec URL (not a package dependency), Turbo had no file edge to the contract sources and would serve a stale cached SDK after a gateway/API change. Added `$TURBO_ROOT$/apps/api/**` and `$TURBO_ROOT$/apps/gateful/**` to the codegen task inputs so contract changes invalidate the cache.

- [#1910](https://github.com/blockful/anticapture/pull/1910) [`cebd048`](https://github.com/blockful/anticapture/commit/cebd04865d4efd1d155ec6a5009b48bd9ee37d9e) Thanks [@brunod-e](https://github.com/brunod-e)! - Resolve the Gateful OpenAPI spec exclusively from the live Gateful URL for both codegen and docs build, dropping the committed `apps/gateful/openapi/gateful.json` fallback so generated output never comes from a stale local file.

## 1.2.1

### Patch Changes

- [#1956](https://github.com/blockful/anticapture/pull/1956) [`18aef34`](https://github.com/blockful/anticapture/commit/18aef3474e8e69ce9162d0ab67a68bf90809bc3d) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Model the onchain proposals response (`/proposals`, `/proposals/search`, `/proposals/{id}`) as a `variant`-tagged discriminated union. When `lean=true` the API returns the `lean` variant (omitting calldatas/values/targets and the proposal description to reduce payload size); otherwise it returns the `full` variant. Clients can narrow on the `variant` discriminator for exact typing instead of guarding optional fields.

## 1.2.0

Regenerated from the Gateful OpenAPI contract to catch up with API changes accumulated since 1.1.0. This version was published manually to npm; this entry backfills the release notes that changesets would normally generate.

### Minor Changes

- [#1919](https://github.com/blockful/anticapture/pull/1919) [`8c1abdf`](https://github.com/blockful/anticapture/commit/8c1abdf1294f28ffe686823b6db44ca5454e0b45) Thanks [@pikonha](https://github.com/pikonha)! - Add generated clients, hooks, and MSW handlers for ENS `/revenue/*` endpoints: `getRevenueActions`, `getRevenueActiveNames`, `getRevenueNewWallets`, `getRevenueRenewalFunnel`, `getRevenueTotals`, `getRevenueByCategory`, and `getRevenueRenewalTenure`.

### Patch Changes

- [#1875](https://github.com/blockful/anticapture/pull/1875) [`cb90c89`](https://github.com/blockful/anticapture/commit/cb90c8941e32c352ef84eb3b3e45298c1233f4ff) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Replace the untyped `FeedMetadata` blob with discriminated metadata schemas (`FeedVoteMetadata`, `FeedProposalMetadata`, `FeedTransferMetadata`, `FeedDelegationMetadata`, and related variants). `/feed/events` now accepts multi-value `type` filters in the generated query params.

- [#1888](https://github.com/blockful/anticapture/pull/1888) [`ac56ee9`](https://github.com/blockful/anticapture/commit/ac56ee949df21ebd7bb0789f2571468b2452ab96) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Drop the dedicated lean proposal routes from the SDK and surface a `lean` query param on the existing on-chain and off-chain proposal endpoints instead. `OnchainProposal.calldatas`, `values`, and `targets`, plus `OffchainProposal.body`, are now optional in the generated types.

- [#1888](https://github.com/blockful/anticapture/pull/1888) [`298cc75`](https://github.com/blockful/anticapture/commit/298cc755cd5d62658d5f97294a61c3c66d886362) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Migrate `getAggregationsAverageDelegationPercentage` from cursor params (`after`/`before`) to `skip`/`limit`, matching the upstream DAO API pagination contract.

- [#1888](https://github.com/blockful/anticapture/pull/1888) [`298cc755`](https://github.com/blockful/anticapture/commit/298cc755cd5d62658d5f97294a61c3c66d886362) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Regenerate types so `percentageChange` on `AccountBalanceVariation` and `VotingPowerVariation` is a plain `string` instead of a mis-typed `bigint`.

- [`156219e`](https://github.com/blockful/anticapture/commit/156219eb109011237bd2957332f092e98ec48cde) Thanks [@lucaspicolloo](https://github.com/lucaspicolloo)! - Add `from` and `to` query params to `historicalBalances` for server-side filtering by transfer sender/recipient.

- [`30dc32c`](https://github.com/blockful/anticapture/commit/30dc32c61) Thanks [@lucaspicolloo](https://github.com/lucaspicolloo)! - Remove the deprecated `transactions` client and its types; use `transfers` instead.

- Regenerate relayer helpers (`getConfig`, `getRateLimit`, `getRelayerBalance`) and bundle MCP server entrypoints in the published `dist/` output.
