# @anticapture/dashboard

## 2.9.0

### Minor Changes

- [#2051](https://github.com/blockful/anticapture/pull/2051) [`c96bf63`](https://github.com/blockful/anticapture/commit/c96bf63062163bf7c46f7dd6da0b9eea4d67cffb) Thanks [@brunod-e](https://github.com/brunod-e)! - Add the API Keys page: signed-in users create, view, and revoke personal API keys for the Anticapture MCP server / public API. Includes the one-time key reveal on creation, a per-key list (name, status, created, last used), and a "Connect your AI agent" section with copy-paste install commands for Claude Code, Cursor, and Codex. Reached from the new "API" sidebar entry; gated behind sign-in.

- [#2051](https://github.com/blockful/anticapture/pull/2051) [`c96bf63`](https://github.com/blockful/anticapture/commit/c96bf63062163bf7c46f7dd6da0b9eea4d67cffb) Thanks [@brunod-e](https://github.com/brunod-e)! - Add platform sign-in (accounts) to the dashboard. A sign-in modal offers
  wallet (SIWE) authentication against the new User API through a same-origin
  `/api/user` proxy, mounted app-wide. Draft proposals move onto the session-
  scoped User API: identity comes from the session (no caller-supplied address),
  shared-draft ownership is derived server-side, and saving prompts sign-in when
  there is no session. The modal also offers email (magic link) and Google
  sign-in, each shown only when the User API deployment reports it as enabled
  (GET /auth/methods); whitelabel is wallet-only.

### Patch Changes

- [#2070](https://github.com/blockful/anticapture/pull/2070) [`23c62be`](https://github.com/blockful/anticapture/commit/23c62be1b2a888cb73059c00e89e995bd04b9000) Thanks [@pikonha](https://github.com/pikonha)! - avoid showing v1.0.0 as default

- [#2067](https://github.com/blockful/anticapture/pull/2067) [`0c03def`](https://github.com/blockful/anticapture/commit/0c03def668daa43ec91b1b677613b9863b6668f0) Thanks [@blockfulintern](https://github.com/blockfulintern)! - fix: upgrade Next.js to 16.2.6 to patch a high-severity RSC DoS (CVE-2026-23870)

- [#2071](https://github.com/blockful/anticapture/pull/2071) [`29cd22f`](https://github.com/blockful/anticapture/commit/29cd22f21caf0e2d1be6ba5f0ca6b7f519afcba3) Thanks [@brunod-e](https://github.com/brunod-e)! - Whitelabel login modal is wallet-only again: the Email and Google sign-in options are hidden on whitelabel deployments regardless of which methods the server offers.

- Updated dependencies [[`fe815fe`](https://github.com/blockful/anticapture/commit/fe815fe4b4fd25e6fa44dd2cf353833fd83d4f4e)]:
  - @anticapture/client@2.0.0

## 2.8.3

### Patch Changes

- [#2050](https://github.com/blockful/anticapture/pull/2050) [`97b2dc7`](https://github.com/blockful/anticapture/commit/97b2dc77b66fa332f4da37608d04c443a2b0aec9) Thanks [@pikonha](https://github.com/pikonha)! - Fix "Failed to vote" on GovernorBravo DAOs (UNI, COMP, GTC, Nouns): castVote simulation used an OZ Governor ABI declaring a uint256 return, but Bravo's castVote returns no data, making viem throw before the wallet opened. Votes now simulate with a void-return ABI.

## 2.8.2

### Patch Changes

- [#2056](https://github.com/blockful/anticapture/pull/2056) [`1051a2d`](https://github.com/blockful/anticapture/commit/1051a2d698b74c95219df903862ed3afe658c514) Thanks [@pikonha](https://github.com/pikonha)! - enable offchain (Snapshot) proposal data for ShutterDAO

- [#2043](https://github.com/blockful/anticapture/pull/2043) [`d071210`](https://github.com/blockful/anticapture/commit/d071210fccfa986abd25bc2e33e545ac2eea386b) Thanks [@brunod-e](https://github.com/brunod-e)! - Update Shutter whitelabel branding: brand color changed to #0044A4, new striped-shield icon (app + OG image), and brand text tokens keep the pure color for saturated dark brands instead of being lightened

## 2.8.1

### Patch Changes

- [#2038](https://github.com/blockful/anticapture/pull/2038) [`9525917`](https://github.com/blockful/anticapture/commit/95259173252f5be22cdc1405f00e24290a5b2d42) Thanks [@pikonha](https://github.com/pikonha)! - Accessibility & maintainability fixes in the whitelabel UI: the offchain voting modal now uses the shared Radix Dialog primitive (proper `role="dialog"`/`aria-modal`, focus trap, escape, and scroll-lock), the desktop sidebar and mobile drawer share one `NAV_ITEMS` source so they can't drift, and the brand link-contrast floor is raised to WCAG's 3:1 minimum.

## 2.8.0

### Minor Changes

- [#1979](https://github.com/blockful/anticapture/pull/1979) [`62064e7`](https://github.com/blockful/anticapture/commit/62064e7d70618bd6ae56c709c6b2b805c3f9d181) Thanks [@Zeugh-eth](https://github.com/Zeugh-eth)! - Add Shutter DAO whitelabel governance frontend. Enables the whitelabel route for Shutter with its navy brand color, and adds Azorius (`submitProposal`) support to the proposal creation flow so Shutter proposals can be created alongside the existing OZ Governor path. The Execute button for Shutter proposals now only appears once the Azorius timelock has elapsed (status `PENDING_EXECUTION`), instead of showing during the ~2-day timelock window where execution reverts on-chain.

### Patch Changes

- [#2030](https://github.com/blockful/anticapture/pull/2030) [`95a976a`](https://github.com/blockful/anticapture/commit/95a976a939419c12cec8e9d4b70ab9714a42ef3a) Thanks [@pikonha](https://github.com/pikonha)! - Fix dashboard production build: stub Node's `fs` module for browser bundles so Turbopack can bundle `@shutter-network/shutter-crypto` used by Shutter offchain voting

- [#2026](https://github.com/blockful/anticapture/pull/2026) [`0743c45`](https://github.com/blockful/anticapture/commit/0743c45530fb9fadfe5c75b07f038a8c74e03240) Thanks [@pikonha](https://github.com/pikonha)! - Add route error boundaries with a recovery UI to DAO and whitelabel pages so a render error no longer blanks the whole page, and surface failed votes-table loads and pagination with a visible error and retry

- [#2013](https://github.com/blockful/anticapture/pull/2013) [`63142ab`](https://github.com/blockful/anticapture/commit/63142ab9b688465382a16fbf8a0f6c6c037b1335) Thanks [@brunod-e](https://github.com/brunod-e)! - Fix voting on Shutter-encrypted offchain proposals (e.g. ENS Copeland elections). The vote choice is now Shutter-encrypted before submission, so the Snapshot sequencer no longer rejects encrypted-privacy proposals with "invalid choice".

## 2.7.0

### Minor Changes

- [#1997](https://github.com/blockful/anticapture/pull/1997) [`8ed6328`](https://github.com/blockful/anticapture/commit/8ed6328d9864d30225a9aefb7baeb63fe790f6dd) Thanks [@brunod-e](https://github.com/brunod-e)! - feat(create-proposal): recursive calldata builder covering every Solidity type (arrays, fixed/multidimensional, tuples/structs, nested) with two-way paste & decode and a live encoded-calldata preview; debounced contract-address validation; "Duplicate action" alongside edit/delete; and improved transfer UX — treasury "Max", always-visible helper text, per-token USD via CoinGecko, and a clearer selected-token state.

- [#1993](https://github.com/blockful/anticapture/pull/1993) [`add9bd1`](https://github.com/blockful/anticapture/commit/add9bd1e96ea89dd26f892fcd30353919d905126) Thanks [@caveman-eth](https://github.com/caveman-eth)! - Surface ENS social records and EFP stats for addresses.
  - `address-enrichment` now reads the EFP `/details` endpoint, capturing the ENS `com.twitter`, `org.telegram`, `email`, and `com.github` text records plus EFP follower/following counts. These are exposed under `ens` (socials) and a new `efp` object, cached under the existing ENS TTL. EFP counts are returned even when the address has no primary ENS name.
  - The Holders & Delegates drawer header now shows follower/following counts (linked to the EFP profile) and social links (X, Telegram, GitHub, email) for the selected address.

- [#2009](https://github.com/blockful/anticapture/pull/2009) [`36992d7`](https://github.com/blockful/anticapture/commit/36992d728e562b32c87402812a54acde82092593) Thanks [@Zeugh-eth](https://github.com/Zeugh-eth)! - support Tornado Cash proposal creation

- [#1990](https://github.com/blockful/anticapture/pull/1990) [`5cb8a21`](https://github.com/blockful/anticapture/commit/5cb8a2168b459c18645f42461078b47692da8430) Thanks [@brunod-e](https://github.com/brunod-e)! - Shareable proposal drafts: add an Editor/Preview toggle, a read-only draft preview, and a recipient flow for shared draft links — publish the draft on-chain or edit it to fork your own copy.

- [#2012](https://github.com/blockful/anticapture/pull/2012) [`3031315`](https://github.com/blockful/anticapture/commit/303131572b12e8a9196a91ac9bd865b0977c2470) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Render Tornado Cash proposal descriptions as Markdown (unwrapping the stringified-JSON body) and show a proposal Info card on the Actions tab for proposals without executable actions.

- [#2002](https://github.com/blockful/anticapture/pull/2002) [`412b9e8`](https://github.com/blockful/anticapture/commit/412b9e87b11b02b5de0dfb1d21d838af53242594) Thanks [@pikonha](https://github.com/pikonha)! - Make TORN vote recasting reachable (show "Change your vote" on already-voted onchain proposals when the DAO allows changing votes) and hide the Abstain option for Tornado Cash, whose binary governor rejects abstain votes.

- [#2002](https://github.com/blockful/anticapture/pull/2002) [`451db65`](https://github.com/blockful/anticapture/commit/451db65d6497503ecebcae24fed44027a2e6479f) Thanks [@pikonha](https://github.com/pikonha)! - Integrate Tornado Cash DAO (TORN): custom stake-to-vote indexer (lock-based delegated supply, timestamp governance), timestamp-based proposal-status API client, and dashboard config/icon.

### Patch Changes

- [#2015](https://github.com/blockful/anticapture/pull/2015) [`196de31`](https://github.com/blockful/anticapture/commit/196de313585e028f747190f8ea7d2d497d140c94) Thanks [@pikonha](https://github.com/pikonha)! - Fix proposal descriptions rendering blank for DAOs (e.g. Compound) whose on-chain descriptions use escaped `\n` newlines, by normalizing them to real line breaks for display.

- [#1995](https://github.com/blockful/anticapture/pull/1995) [`eaacf28`](https://github.com/blockful/anticapture/commit/eaacf28668967881c626e673f70af43de4233f74) Thanks [@pikonha](https://github.com/pikonha)! - Drop the shared-dev-Gateful fallback for untrusted/fork Vercel PR previews. Those previews get no PR-scoped Railway service, so they can never reflect a PR's API/Gateful changes — pointing them at `dev-gateful` only produced a misleading preview. The dashboard `next.config.ts` and the `@anticapture/client` Gateful OpenAPI spec resolver now rely solely on an explicit `ANTICAPTURE_API_URL` (injected by CI for trusted PRs / set on dev & production) or a Railway PR-preview environment; anything else throws instead of silently falling back.

- [#2011](https://github.com/blockful/anticapture/pull/2011) [`acdaf82`](https://github.com/blockful/anticapture/commit/acdaf82ad448587254f9c22aaa9b99f3e611b277) Thanks [@brunod-e](https://github.com/brunod-e)! - fix(dashboard): use dynamic viewport height (dvh) for the app/whitelabel shells so the sticky bottom action bar (e.g. create-proposal Publish/Save Draft) is no longer hidden behind the mobile browser's bottom toolbar.

- [#2002](https://github.com/blockful/anticapture/pull/2002) [`2fc7174`](https://github.com/blockful/anticapture/commit/2fc71740f3953d5c49eaf92d5ab7947ae821ce0f) Thanks [@pikonha](https://github.com/pikonha)! - Fix TORN historical voting power rows being rendered as bogus zero-address delegations. TORN derives voting power directly from Transfers, so each history row shares the Transfer's log index, which the generic repository's strict `<` join never matched. Added a dedicated TORN voting-power repository that links the causing event at `logIndex <= row logIndex`. Dashboard also formats the auto-delegation fallback amount instead of dumping the raw delta.

- Updated dependencies [[`4a85cf4`](https://github.com/blockful/anticapture/commit/4a85cf47d6a56b3f0c9de5da87978e0687755c55), [`e57bf06`](https://github.com/blockful/anticapture/commit/e57bf06b022728ccb9bb32f6c2622125c3d2a506), [`add9bd1`](https://github.com/blockful/anticapture/commit/add9bd1e96ea89dd26f892fcd30353919d905126), [`51e110a`](https://github.com/blockful/anticapture/commit/51e110a12820493c453097fc069b194f0b8c08e5), [`172558c`](https://github.com/blockful/anticapture/commit/172558c1b1284c085b68a8cd8316a7fb023d287f), [`2dea74c`](https://github.com/blockful/anticapture/commit/2dea74c32a99f8475894df6b2e59e759ecaf233a), [`eaacf28`](https://github.com/blockful/anticapture/commit/eaacf28668967881c626e673f70af43de4233f74), [`d94129c`](https://github.com/blockful/anticapture/commit/d94129ca6d9d488689f7ada91db4d1c7c8020394)]:
  - @anticapture/client@1.4.0

## 2.6.0

### Minor Changes

- [#1910](https://github.com/blockful/anticapture/pull/1910) [`a006283`](https://github.com/blockful/anticapture/commit/a0062835b784f0b97363c664ab7efb3ee4177171) Thanks [@brunod-e](https://github.com/brunod-e)! - feat(draft-proposals): persist draft proposals in PostgreSQL with SIWE authentication

  Moves draft proposal storage from browser localStorage to the API's PostgreSQL database. Adds SIWE-based JWT authentication endpoints (`GET /auth/nonce`, `POST /auth/verify`) and full CRUD endpoints for draft proposals (`/proposal/drafts`). On wallet connect, existing localStorage drafts are automatically migrated to the database. Drafts are scoped per user address and DAO.

- [#1973](https://github.com/blockful/anticapture/pull/1973) [`7b562d5`](https://github.com/blockful/anticapture/commit/7b562d599a126b89e4e95ca84470b0df863a9aa5) Thanks [@isadorable-png](https://github.com/isadorable-png)! - Gov FE improvements: unify onchain/offchain proposals into a single list with a source filter (All sources / Snapshot / Governor), add source badges (Governor/Snapshot) to proposal cards and the proposal detail page, show the leading option for Snapshot polls with more than two choices, add a "You voted" badge and an abstain segment to vote progress bars, adapt the proposals view for mobile, and redesign the whitelabel OG image with a fixed "Gov Interface" label plus per-page titles.

- [#1976](https://github.com/blockful/anticapture/pull/1976) [`4e5f06a`](https://github.com/blockful/anticapture/commit/4e5f06a261211b9a94eb0e40047468000ba40363) Thanks [@LeonardoVieira1630](https://github.com/LeonardoVieira1630)! - Switch relayer rate limiting from a shared daily window to per-operation monthly limits (separate caps for votes and delegations), configurable via `MAX_VOTES_PER_ADDRESS_PER_MONTH` and `MAX_DELEGATIONS_PER_ADDRESS_PER_MONTH` (each defaulting to 3). The `/relay/config` and `/relay/rate-limit/{address}` responses now expose per-operation `limits`/`limit` and a monthly `resetsAt`; the client SDK is regenerated to match. The dashboard `useGaslessRelayer` hook now exposes `voteLimit`/`delegationLimit` in place of the removed `maxRelayPerAddressPerDay`/`maxPerDay` fields.

### Patch Changes

- [#1983](https://github.com/blockful/anticapture/pull/1983) [`83e97d8`](https://github.com/blockful/anticapture/commit/83e97d844a442d63e4bd0ecf1f935799c1c71141) Thanks [@alextnetto](https://github.com/alextnetto)! - Remove redundant alert channel card descriptions from the alerts page.

- Updated dependencies [[`e5840e8`](https://github.com/blockful/anticapture/commit/e5840e89b2aa2d9090078a3fcbb5ba856caa65e6), [`cebd048`](https://github.com/blockful/anticapture/commit/cebd04865d4efd1d155ec6a5009b48bd9ee37d9e), [`4e5f06a`](https://github.com/blockful/anticapture/commit/4e5f06a261211b9a94eb0e40047468000ba40363), [`05a7cf2`](https://github.com/blockful/anticapture/commit/05a7cf2d7280b392579a342db3810c6e1fa0d54d)]:
  - @anticapture/client@1.3.0

## 2.5.0

### Minor Changes

- [#1964](https://github.com/blockful/anticapture/pull/1964) [`967b8b9`](https://github.com/blockful/anticapture/commit/967b8b9da5be1e66d9039a33879ec9270d598ed4) Thanks [@pikonha](https://github.com/pikonha)! - Revenue dashboard: run-rate hero with 1Y/YTD/MAX timeframe toggle and Month/Quarter/Year chart granularity.

### Patch Changes

- [#1964](https://github.com/blockful/anticapture/pull/1964) [`325d8c0`](https://github.com/blockful/anticapture/commit/325d8c07ab3ff4998a288e1cb924342af243e422) Thanks [@pikonha](https://github.com/pikonha)! - Revenue summary card: label the run-rate delta as "vs prior 3 months" instead of "vs prev. quarter" to match the trailing-3-month calculation.

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
