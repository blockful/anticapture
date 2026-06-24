# @anticapture/client

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
