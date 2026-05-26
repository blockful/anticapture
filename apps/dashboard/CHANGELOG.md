# @anticapture/dashboard

## 2.3.1

### Patch Changes

- [#1936](https://github.com/blockful/anticapture/pull/1936) [`bc7fc0a`](https://github.com/blockful/anticapture/commit/bc7fc0aea4aca97869a62d08423c41e61790a6ab) Thanks [@pikonha](https://github.com/pikonha)! - Footer now shows the latest dashboard release version instead of the most recent repo release (which could belong to another package like gateful).

## 2.3.0

### Minor Changes

- [#1875](https://github.com/blockful/anticapture/pull/1875) [`cb90c89`](https://github.com/blockful/anticapture/commit/cb90c8941e32c352ef84eb3b3e45298c1233f4ff) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Migrate feed event metadata from a denormalized `feed_event.metadata` JSON column to query-time synthesis against `proposals_onchain`, `votes_onchain`, `delegations`, `transfers`, and `voting_power_history`. Adds discriminated metadata schemas to the OpenAPI contract, supports multi-type filtering on `/feed/events`, and wires the dashboard event-type filter as a multi-select.

- [#1912](https://github.com/blockful/anticapture/pull/1912) [`22b4602`](https://github.com/blockful/anticapture/commit/22b46024206d8b9986a44f37b2caad920f0692dc) Thanks [@pikonha](https://github.com/pikonha)! - governance using kubb sdk

- [#1931](https://github.com/blockful/anticapture/pull/1931) [`1dc424a`](https://github.com/blockful/anticapture/commit/1dc424a4d7a91d33edff5ecdfdfd7642ad2d0292) Thanks [@brunod-e](https://github.com/brunod-e)! - Add suggested token chips to AddTransferModal, dual y-axis on revenue ComboChart, 7-year horizon on renewal tenure, and refine revenue metrics: window-based KpiRow (3M/6M/1Y/3Y/MAX) with previous-period deltas, single-bar Name Growth chart with sign-based color, YTD comparison in hero, 12-month horizon on Upcoming Expirations subtitle, and definition tooltip on New Wallets chart

## 2.2.4

### Patch Changes

- [#1911](https://github.com/blockful/anticapture/pull/1911) [`8f42b36`](https://github.com/blockful/anticapture/commit/8f42b36e4be4b415405cdf8a00e1b3817ece5538) Thanks [@pikonha](https://github.com/pikonha)! - feat(dashboard): add home screen app icon and web manifest for PWA support

## 2.2.3

### Patch Changes

- [#1921](https://github.com/blockful/anticapture/pull/1921) [`97b693c`](https://github.com/blockful/anticapture/commit/97b693c65f4dcc725fb6092681b8e039e3559dd2) Thanks [@brunod-e](https://github.com/brunod-e)! - Fix revenue dashboard rendering bugs: correct ComboChart year-label formatter to avoid "202026" output, align Renewal Rate comparison to quarterly delta, fix KPI up-arrow color to use the success text token, and restore 7D filter to an exact 7-day window instead of snapping to month start.

## 2.2.2

### Patch Changes

- [#1894](https://github.com/blockful/anticapture/pull/1894) [`9f50094`](https://github.com/blockful/anticapture/commit/9f5009462c6379984971987e8c7f2be9fc5fc606) Thanks [@pikonha](https://github.com/pikonha)! - perf(dashboard): replace single Suspense boundary in DaoOverviewSection with per-card boundaries so each chart card streams independently

- [#1907](https://github.com/blockful/anticapture/pull/1907) [`029f875`](https://github.com/blockful/anticapture/commit/029f875f9246eedf91e76a1aa326ece02455004e) Thanks [@pikonha](https://github.com/pikonha)! - fix(dashboard): add missing JSX key props in PanelSection Carousel slides

- [#1904](https://github.com/blockful/anticapture/pull/1904) [`34cacf0`](https://github.com/blockful/anticapture/commit/34cacf0672c340674ecfc8fa7745e64608369214) Thanks [@brunod-e](https://github.com/brunod-e)! - create proposal ui fixes

- [#1890](https://github.com/blockful/anticapture/pull/1890) [`cd54040`](https://github.com/blockful/anticapture/commit/cd54040ec415380777a6f316b70b6d28f64cb08c) Thanks [@pikonha](https://github.com/pikonha)! - fix(dashboard): surface off-chain vote state inline, fix modal copy, and eliminate display lag on Snapshot proposals

- [#1896](https://github.com/blockful/anticapture/pull/1896) [`72b977a`](https://github.com/blockful/anticapture/commit/72b977ac49c56698191c0fe79f2d78f2ba3bf8b5) Thanks [@pikonha](https://github.com/pikonha)! - perf: fix derived state in effects and remove isMounted pattern

  Remove accumulatedProposals state/effect in useProposalsActivity (derive from Apollo cache directly), add lazy initialisers for Map/Set state in useDelegates, add timeout cleanup in SectionComposedChart, and inline hasNextPage arithmetic in useDelegateDelegationHistory.

- [#1893](https://github.com/blockful/anticapture/pull/1893) [`3c96b00`](https://github.com/blockful/anticapture/commit/3c96b005f7d16c6220ff1ee024dcf2de21ee2eb6) Thanks [@pikonha](https://github.com/pikonha)! - perf(dashboard): convert Array.includes/some to Set.has in render loops

- [#1902](https://github.com/blockful/anticapture/pull/1902) [`cfb38fa`](https://github.com/blockful/anticapture/commit/cfb38faedf63c63ef10c4830315c64d5f4f0ab67) Thanks [@pikonha](https://github.com/pikonha)! - fix(dashboard): land whitelabel hostnames on `/proposals` instead of leaking the internal `/whitelabel/[daoId]/proposals` path into the URL
