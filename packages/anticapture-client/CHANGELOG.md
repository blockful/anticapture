# @anticapture/client

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
