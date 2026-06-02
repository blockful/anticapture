# @anticapture/dashboard

## 2.4.0

### Minor Changes

- [#1958](https://github.com/blockful/anticapture/pull/1958) [`bf3dbeb`](https://github.com/blockful/anticapture/commit/bf3dbebd3b6125a039fde50239f4e2c4c523164d) Thanks [@pikonha](https://github.com/pikonha)! - remove legacy graphql gateway integrations

### Patch Changes

- [#1941](https://github.com/blockful/anticapture/pull/1941) [`77e2edd`](https://github.com/blockful/anticapture/commit/77e2eddf938a2038d2b5a915593108b86aaad396) Thanks [@brunod-e](https://github.com/brunod-e)! - Migrate attack-profitability hooks (useTreasury, useDaoTokenHistoricalData) from GraphQL client to kubb-generated REST SDK (@anticapture/client)

- [#1947](https://github.com/blockful/anticapture/pull/1947) [`8ffc325`](https://github.com/blockful/anticapture/commit/8ffc325c76ac3e107c4ece43c9b93c828f3aa8ce) Thanks [@pikonha](https://github.com/pikonha)! - token distribution fetching lean proposals

- [#1945](https://github.com/blockful/anticapture/pull/1945) [`02ddb23`](https://github.com/blockful/anticapture/commit/02ddb2333923fe8932a722ff5cbd395c08767650) Thanks [@brunod-e](https://github.com/brunod-e)! - Migrate dao-overview hooks and 4 thin shared wrappers (useDaoData, useTokenData, useActiveSupply, useAverageTurnout) from the GraphQL client to the kubb-generated REST SDK (@anticapture/client). Delete unused useCompareTreasury wrapper.

- [#1957](https://github.com/blockful/anticapture/pull/1957) [`e2f04b6`](https://github.com/blockful/anticapture/commit/e2f04b6124a667d289875d716278f0c819837fbb) Thanks [@brunod-e](https://github.com/brunod-e)! - clarify ens revenue info on the whitelabel

- [#1956](https://github.com/blockful/anticapture/pull/1956) [`c549c95`](https://github.com/blockful/anticapture/commit/c549c9519f43cfab8cdb696b6db1aa9059f1c777) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Adapt the governance UI to the new `variant`-tagged onchain proposals response: narrow the SDK union to the `full` variant in the proposal hooks, search adapter, and detail page (the dashboard always requests the full payload).

- [#1955](https://github.com/blockful/anticapture/pull/1955) [`4f4f56d`](https://github.com/blockful/anticapture/commit/4f4f56dde804faf0cce7ceb5ad348ffbf72c887e) Thanks [@brunod-e](https://github.com/brunod-e)! - Migrate offchain governance (proposals, votes, and token metrics in the proposal view) off `@anticapture/graphql-client` to the kubb SDK. Apollo infinite pagination (`fetchMore`) is replaced with react-query infinite queries, and cache refetch is replaced with `invalidateQueries`. No user-visible change.

- [#1954](https://github.com/blockful/anticapture/pull/1954) [`52ad49d`](https://github.com/blockful/anticapture/commit/52ad49ddf0341b551afa083fe3999244f8aaca28) Thanks [@brunod-e](https://github.com/brunod-e)! - Migrate remaining shared hooks (`useDelegatedSupply`, `useLastUpdate`, `useConnectedWalletVotingPower`) off `@anticapture/graphql-client` to the kubb SDK, and remove the now-unused `useVotes` and `useTokenInfo` hooks. No user-visible change.

- [#1947](https://github.com/blockful/anticapture/pull/1947) [`4faf797`](https://github.com/blockful/anticapture/commit/4faf797a930bad6d7d96e2106eea778ef61d2e76) Thanks [@pikonha](https://github.com/pikonha)! - Migrate token distribution data fetching from GraphQL client to Kubb REST SDK (`@anticapture/client`). Replaces `useGetProposalsQuery`, `useTokenMetricsLazyQuery`, and `useHistoricalTokenDataQuery` with their REST counterparts.

- [#1953](https://github.com/blockful/anticapture/pull/1953) [`1436411`](https://github.com/blockful/anticapture/commit/1436411eaf5d6e7f10a354a1b41e52348cbd7099) Thanks [@brunod-e](https://github.com/brunod-e)! - Migrate the panel's delegated-supply history chart off `@anticapture/graphql-client` to the kubb SDK, using the `useAverageDelegationPercentage` aggregate endpoint. No user-visible change.

- Updated dependencies [[`18aef34`](https://github.com/blockful/anticapture/commit/18aef3474e8e69ce9162d0ab67a68bf90809bc3d)]:
  - @anticapture/client@1.2.1

## 2.3.3

### Patch Changes

- [#1940](https://github.com/blockful/anticapture/pull/1940) [`98728e5`](https://github.com/blockful/anticapture/commit/98728e517a8deff5dc494fc6020b878605538daa) Thanks [@isadorable-png](https://github.com/isadorable-png)! - Add Umami and PostHog event tracking for `proposal_create_click` on the governance "New Proposal" button (with `dao` property) and `feature_request_click` on the whitelabel "Request feature" links in both the shell and sidebar (with `source` property). The PostHog click handler now also captures an optional `dao` property from `data-ph-dao`.

## 2.3.2

### Patch Changes

- [#1913](https://github.com/blockful/anticapture/pull/1913) [`156219e`](https://github.com/blockful/anticapture/commit/156219eb109011237bd2957332f092e98ec48cde) Thanks [@pikonha](https://github.com/pikonha)! - Add server-side `from` and `to` query parameters to `GET /accounts/{address}/balances/historical`. The dashboard's balance history now applies the buy/sell and custom address filters in the query (regenerated client surfaces them) so `totalCount`, pagination, and the first-page contents reflect the filtered set instead of being filtered after fetching. Fixes empty/incomplete filtered pages when matches live on later pages of the unfiltered dataset.

- [#1942](https://github.com/blockful/anticapture/pull/1942) [`5e9aac3`](https://github.com/blockful/anticapture/commit/5e9aac3fab82c7e279fc9eb30e4e00ddd0ff3cbc) Thanks [@alextnetto](https://github.com/alextnetto)! - Support Snapshot copeland offchain votes and show full choice labels in proposal results.

- [#1913](https://github.com/blockful/anticapture/pull/1913) [`2df53fa`](https://github.com/blockful/anticapture/commit/2df53fa4201c1a267603952694765928e89d2e5a) Thanks [@pikonha](https://github.com/pikonha)! - Fix infinite scroll on the delegate proposals activity drawer. The summary fields (`totalProposals`, `votedProposals`, etc.) are only returned by the API on the first page, so the next-page check now anchors on the first page's total instead of the last page's (which was always 0 after the initial fetch).

- [#1944](https://github.com/blockful/anticapture/pull/1944) [`8978c4f`](https://github.com/blockful/anticapture/commit/8978c4f4d0b7a638486de6c80b578b8f5fb1f98f) Thanks [@pikonha](https://github.com/pikonha)! - Fix token holders pagination duplicating rows (wire the shared `getNextPageParam` into `useAccountBalancesInfinite`), unify `getHistoricalBalanceCount` on a single joined query so totals match returned items, memoize delegator dedup, anchor account-interactions `totalCount` to the first page, drop the redundant `fetchNextPageStable` wrapper in `useDelegates`, and document the single-page `limit: 1000` truncation in the balance-history and delegate-delegation-history graph hooks.

- [#1913](https://github.com/blockful/anticapture/pull/1913) [`e690291`](https://github.com/blockful/anticapture/commit/e690291b206563c897b0e806054158cbcd6c676d) Thanks [@pikonha](https://github.com/pikonha)! - Migrate holders-and-delegates data fetches from GraphQL client to kubb-generated REST SDK (@anticapture/client)

- [#1913](https://github.com/blockful/anticapture/pull/1913) [`37bba79`](https://github.com/blockful/anticapture/commit/37bba7916210a5a6554e9e448a4da7dd0957b298) Thanks [@pikonha](https://github.com/pikonha)! - Migrate vote-composition delegators to the REST client and restore DAO-page sorting and balance-history filter precedence.

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
