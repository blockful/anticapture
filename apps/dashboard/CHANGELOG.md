# @anticapture/dashboard

## 2.15.1

### Patch Changes

- [#2147](https://github.com/blockful/anticapture/pull/2147) [`61ceeb8`](https://github.com/blockful/anticapture/commit/61ceeb8193e4cf29ef7e8c61f8ae715ea5858d66) Thanks [@brunod-e](https://github.com/brunod-e)! - Show the address column again on the Aave delegates table at desktop widths.

- Updated dependencies [[`2822cdd`](https://github.com/blockful/anticapture/commit/2822cdde3f30604b78c53dc525d9fb925eb68997)]:
  - @anticapture/client@2.1.1

## 2.15.0

### Minor Changes

- [#2135](https://github.com/blockful/anticapture/pull/2135) [`1610f3c`](https://github.com/blockful/anticapture/commit/1610f3c248dfdbf3d90cab08129305448bdf15e3) Thanks [@brunod-e](https://github.com/brunod-e)! - Enable the Compound whitelabel with full governance (create, vote, queue and execute proposals).

- [#2134](https://github.com/blockful/anticapture/pull/2134) [`9ddac26`](https://github.com/blockful/anticapture/commit/9ddac267a56c53325dd622414adbbee0d015fbd0) Thanks [@brunod-e](https://github.com/brunod-e)! - Enable the Gitcoin whitelabel with full governance (create, vote, queue and execute proposals).

- [#2137](https://github.com/blockful/anticapture/pull/2137) [`1c8f1a1`](https://github.com/blockful/anticapture/commit/1c8f1a15ab65328312044a732e096539463d7c7d) Thanks [@brunod-e](https://github.com/brunod-e)! - Replace the Panel section header with the v2.1 hero: a judgment headline, a subhead explaining the Stage framework, a link to the framework docs, and a "Governance risk, right now" card showing Stage 0/1/2 as horizontal bars with per-stage hover detail. Retires the Treasury Monitoring and Delegated Supply History cards.

- [#2137](https://github.com/blockful/anticapture/pull/2137) [`c24a289`](https://github.com/blockful/anticapture/commit/c24a28943741af09a339a237306088857f26ad16) Thanks [@brunod-e](https://github.com/brunod-e)! - Add the Blockful services row at the foot of the panel, listing the service lines with a link to the contact page.

- [#2137](https://github.com/blockful/anticapture/pull/2137) [`2c87e1e`](https://github.com/blockful/anticapture/commit/2c87e1eb62ab2d1c20b66e2cdda5c0c55c1ab4c4) Thanks [@brunod-e](https://github.com/brunod-e)! - Show every monitored DAO on the panel: the homepage itself now scrolls and the table header stays pinned on desktop.

- [#2137](https://github.com/blockful/anticapture/pull/2137) [`8a21e30`](https://github.com/blockful/anticapture/commit/8a21e306ddf5c947e1608150725b4ed257b0af10) Thanks [@brunod-e](https://github.com/brunod-e)! - Add the "Latest finding" ticker between the panel hero and the Monitored DAOs table. The strip shows the newest post on the blockful Paragraph publication, read server-side from its RSS feed and revalidated hourly, and links out to that post. If the feed is unreachable it falls back to the publication index, so the ticker always renders.

- [#2137](https://github.com/blockful/anticapture/pull/2137) [`388e6b2`](https://github.com/blockful/anticapture/commit/388e6b2d59828c614fb67f5c2d51edd43e74edf1) Thanks [@brunod-e](https://github.com/brunod-e)! - Add the "Track record" section to the panel: three outcome-framed case cards linking to the case write-ups, plus a testimonial carousel carrying the verified quotes from the X mentions audit. `ClickableCard` now accepts an `href` so cards can render as links.

- [#2137](https://github.com/blockful/anticapture/pull/2137) [`02a9a0a`](https://github.com/blockful/anticapture/commit/02a9a0a1387ea6827aea1b4ecd5c32465ff5e294) Thanks [@brunod-e](https://github.com/brunod-e)! - Add the "Use it now" section to the panel and an explainer strip above the channel cards on the alerts page.

- [#2136](https://github.com/blockful/anticapture/pull/2136) [`ae55201`](https://github.com/blockful/anticapture/commit/ae5520130c4f0910f45bd509c1ecc15a4b4d4097) Thanks [@brunod-e](https://github.com/brunod-e)! - Enable the Tornado Cash whitelabel with full governance (create, vote and execute proposals).

- [#2130](https://github.com/blockful/anticapture/pull/2130) [`9ac2df2`](https://github.com/blockful/anticapture/commit/9ac2df290deb2ea7f8d2822d26a8f50c9e8175a0) Thanks [@brunod-e](https://github.com/brunod-e)! - Enable the Uniswap whitelabel with full governance. `uniswap.gov.blockful.io` now
  resolves to the whitelabel shell, and Uniswap joins ENS and Shutter as a DAO you
  can draft, publish, vote on, queue and execute proposals for. Proposal creation
  goes through a new GovernorBravo `propose(targets, values, signatures, calldatas,
description)` path, which also rejects proposals past the governor's 10-action
  `proposalMaxOperations` before they reach the wallet.

- [#2130](https://github.com/blockful/anticapture/pull/2130) [`dae9bc8`](https://github.com/blockful/anticapture/commit/dae9bc82c2a28623982f8f29f23f0da1e664b165) Thanks [@brunod-e](https://github.com/brunod-e)! - Add an in-app "Request a Feature" drawer to the whitelabel, opened by the sidebar
  button whenever a DAO has no external `requestFeatureLink` (like Uniswap).

### Patch Changes

- [#2140](https://github.com/blockful/anticapture/pull/2140) [`0a8f048`](https://github.com/blockful/anticapture/commit/0a8f048052765c8d07b2c4e787260eff3f2a1b58) Thanks [@brunod-e](https://github.com/brunod-e)! - Fix the panel risk heading level and enlarge the testimonial arrows' touch targets.

- [#2141](https://github.com/blockful/anticapture/pull/2141) [`a838517`](https://github.com/blockful/anticapture/commit/a8385173c4f6bb53185ea2386d755245aab36ee7) Thanks [@brunod-e](https://github.com/brunod-e)! - Restore the Shutter DAO in the dashboard DAO list.

- [#2136](https://github.com/blockful/anticapture/pull/2136) [`ae55201`](https://github.com/blockful/anticapture/commit/ae5520130c4f0910f45bd509c1ecc15a4b4d4097) Thanks [@brunod-e](https://github.com/brunod-e)! - Fix Tornado Cash voting for accounts without delegators by using castVote instead of castDelegatedVote.

- [#2142](https://github.com/blockful/anticapture/pull/2142) [`a9deec7`](https://github.com/blockful/anticapture/commit/a9deec7dea199008eae1a647331faffd182f8182) Thanks [@brunod-e](https://github.com/brunod-e)! - Exclude the voter's own address from the Tornado delegated-vote list so castDelegatedVote does not revert.

- [#2140](https://github.com/blockful/anticapture/pull/2140) [`0a8f048`](https://github.com/blockful/anticapture/commit/0a8f048052765c8d07b2c4e787260eff3f2a1b58) Thanks [@brunod-e](https://github.com/brunod-e)! - Show why the Tornado vote submit is disabled while delegators load or fail to load.

- Updated dependencies [[`b02461b`](https://github.com/blockful/anticapture/commit/b02461b64ae44f0fadc2b497ec2363c13d00bf4a)]:
  - @anticapture/client@2.1.0

## 2.14.1

### Patch Changes

- [#2112](https://github.com/blockful/anticapture/pull/2112) [`2bceb82`](https://github.com/blockful/anticapture/commit/2bceb8236d85654972fdfbba9167e2c0fd3c319e) Thanks [@brunod-e](https://github.com/brunod-e)! - Fix WalletConnect pairing by giving the provider an absolute RPC proxy URL.

## 2.14.0

### Minor Changes

- [#2113](https://github.com/blockful/anticapture/pull/2113) [`e4222eb`](https://github.com/blockful/anticapture/commit/e4222ebaadabacf81b8ad906aac1e0faafd864f0) Thanks [@pikonha](https://github.com/pikonha)! - Mark proposals whose calldata was verified in the blockful/dao-proposals repo with a shield icon, on both the proposals list and the proposal detail page (whitelabel included). The icon links to the proposal's calldata check test file.

### Patch Changes

- [#2116](https://github.com/blockful/anticapture/pull/2116) [`6bd3050`](https://github.com/blockful/anticapture/commit/6bd30500e76e6686f9e427159cbbf105c2cafc4e) Thanks [@brunod-e](https://github.com/brunod-e)! - Fix the whitelabel stakeholders table cutting off the address column.

## 2.13.2

### Patch Changes

- [#2109](https://github.com/blockful/anticapture/pull/2109) [`12e803e`](https://github.com/blockful/anticapture/commit/12e803ef4d83ac877be1c0cd15a7443d17725ab6) Thanks [@pikonha](https://github.com/pikonha)! - Sync the Token Holders and AAVE delegation amount filters with the URL so shared links show the active range.

## 2.13.1

### Patch Changes

- [#2107](https://github.com/blockful/anticapture/pull/2107) [`c864c11`](https://github.com/blockful/anticapture/commit/c864c11e5e93f9c5698a31af9c24077899151ce9) Thanks [@pikonha](https://github.com/pikonha)! - Fix PR review findings: tag proposal-creation telemetry on the menu items instead of the trigger, keep the delegates amount filter in sync with the URL filter state, and derive the custom range end boundary from local midnight so DST days aren't off by an hour.

## 2.13.0

### Minor Changes

- [#2102](https://github.com/blockful/anticapture/pull/2102) [`7236413`](https://github.com/blockful/anticapture/commit/723641373326a4607dbb500eca844948c62603f2) Thanks [@brunod-e](https://github.com/brunod-e)! - Import a proposal from JSON when creating one.

## 2.12.0

### Minor Changes

- [#2084](https://github.com/blockful/anticapture/pull/2084) [`4e59732`](https://github.com/blockful/anticapture/commit/4e59732daf40b800986ab9ec42a10127b29465f4) Thanks [@brunod-e](https://github.com/brunod-e)! - Holders & Delegates v3 (DEV-562, DEV-476)

  API: new endpoints backing the module. `GET /:dao/voting-powers/inactive-summary`
  (delegated VP parked with inactive delegates), `GET /:dao/accounts/:address/delegators/historical`
  (former delegators with VP impact, start/end and redelegation target), and
  `GET /:dao/addresses/labels` (per-DAO treasury/vesting labels, where an unlock
  contract whose label does not mention vesting is classified by address so the
  dashboard can still relabel its transfers as a vesting unlock; contracts whose
  outgoing transfers are not unlocks, such as airdrop distributors and staking
  vaults, stay out). Adds an optional
  `address` filter to `GET /:dao/feed/events`, and an optional `toDate` upper bound
  to `GET /:dao/proposals-activity` so a bounded period counts only the proposals
  inside it. That upper bound is keyed on when a proposal's voting opens (creation
  plus the DAO voting delay), not on when it was created, so on DAOs with a
  non-zero voting delay a proposal created inside the period whose voting only
  opens after it no longer counts: no vote could land in the window, and counting
  it marked delegates inactive on proposals they could not yet vote on. On
  `GET /:dao/voting-powers/inactive-summary` that also keeps `totalProposals` at
  zero when the window holds nothing votable, instead of reporting every delegate
  as inactive. Both `GET /:dao/proposals-activity` and
  `GET /:dao/voting-powers/inactive-summary` also bound the vote by `toDate`: a
  proposal that opens near the end of the period stays votable after it, so a vote
  cast later no longer counts as activity inside a period that closed before the
  vote existed. The proposal is still listed, with no vote attached. The same bound
  applies at the other end: a proposal whose voting period overlaps `fromDate` is
  in scope, but a vote cast on it before that date happened outside the period and
  no longer counts as activity inside it either. On
  `GET /:dao/accounts/:address/delegators/historical`, `amount` reports the voting
  power the queried address actually lost at the move away rather than the value
  stored on the last delegation event: balances that move while a delegation stands
  write no delegation row, so that value is a stale snapshot, and the share it
  represented is instead applied to the balance the move-away event carries. Full
  delegation therefore reports the whole balance moved, and partial delegation
  (SCR) keeps its fraction rather than claiming the sibling delegates' part. On AAVE, `fromValue`/`toValue` on `GET /:dao/voting-powers` now filter the
  delegated voting power alone instead of the combined total (delegated power plus
  the account's own balance), matching both the `votingPower` ordering on the same
  endpoint and every other DAO's behavior, so the range a client asks for matches
  the delegation figure it renders.
  Feed DELEGATION metadata gains an optional `delegatees` array of
  `{ delegate, amount }`, present only when the source event split voting power
  across more than one delegatee (partial delegation, as SCR does), ordered by
  delegate address ascending; `delegate`/`amount` stay as they were and describe
  the primary delegatee, so existing consumers are unaffected. Gateful re-exposes
  the expanded surface through its aggregated OpenAPI spec (no gateway code
  change).

  Dashboard: value min/max filters on the Delegates and Token Holders tables;
  Delegates as the default tab and the sidebar renamed to "Stakeholders"; larger
  rows with bottom borders and a continuous activity ring; voting power shown as a
  percentage of quorum; inactive-delegate flagging and 0/0 activity states
  ("Inactive" / "No proposals" / "Never voted"); the inactive-VP alert banner on
  Token Holders; clickable addresses that re-point the drawer everywhere; a
  per-address Activity tab in the drawer, on the DAOs that serve the activity
  feed; Buy/Sell relabeled to In / Out / Vested;
  a dust badge and "Hide dust" switch on Top Interactions; a "Filter low importance"
  toggle and "All time" range on Voting Power History; a MAX option and a custom
  calendar range on the time selector, single days included; and a Former
  Delegators view in the
  delegate profile.

- [#2097](https://github.com/blockful/anticapture/pull/2097) [`dd95b49`](https://github.com/blockful/anticapture/commit/dd95b49f054856560f4fe0a6e4175b7e4383ae53) Thanks [@alextnetto](https://github.com/alextnetto)! - Update the ENS Security Council card to the council seated in July 2026 (5/8 multisig, expires July 16, 2028) and add Compound's Proposal Guardian with its expiration

### Patch Changes

- [#2083](https://github.com/blockful/anticapture/pull/2083) [`7d4c104`](https://github.com/blockful/anticapture/commit/7d4c104bfc2250997bae446d99e88502c31d6ec7) Thanks [@pikonha](https://github.com/pikonha)! - Move data inconsistency report trigger from Help dropdown to inline Flag icon in each panel. The panel name is now structurally correct (it's literally where you clicked), removing the need for the dropdown, `report-panels.ts` constants, the `section` field, and the server-side allowlist.

- [#2101](https://github.com/blockful/anticapture/pull/2101) [`db75781`](https://github.com/blockful/anticapture/commit/db75781b4cb59395bd6097c58b18502e7658b5ed) Thanks [@alextnetto](https://github.com/alextnetto)! - Raise the proposal description limit in the create-proposal form from 10,000 to 100,000 characters, matching the ceiling the drafts endpoint already enforces. Long governance proposals are no longer blocked from being published, and the editor footer counter warns as the new limit approaches instead of failing with a generic error.

## 2.11.1

### Patch Changes

- [#2084](https://github.com/blockful/anticapture/pull/2084) [`ff22247`](https://github.com/blockful/anticapture/commit/ff222472634dd5532d7716067cbbb34f8ad67485) Thanks [@brunod-e](https://github.com/brunod-e)! - Address PR review findings: keep the optimistic off-chain tally applied until
  the replacement vote is actually indexed (and poll for it), drop optimistic
  scores for ranked/quadratic ballots whose tally can't be predicted locally, use
  Snapshot's `scores_total` as the turnout denominator for approval winners, stop
  offering "Change vote" once voting has closed, render ENS avatars unoptimized so
  arbitrary avatar hosts still load, align the validation metrics' activity day
  with Authful's UTC usage buckets, drop retained daily figures at the day
  boundary, and stop requiring `USER_API_METRICS_TOKEN` at boot.

## 2.11.0

### Minor Changes

- [#2087](https://github.com/blockful/anticapture/pull/2087) [`6bedeb2`](https://github.com/blockful/anticapture/commit/6bedeb2b27f5d763c8ee11eb0aa6a01c74549951) Thanks [@brunod-e](https://github.com/brunod-e)! - Rework the off-chain (Snapshot) proposal experience.

  Each vote type now renders its own purpose-built ballot: single choice and basic
  radio rows, an approval ballot with an "N of M selected" counter, a weighted
  ballot with per-option steppers, colored allocation dots, a stacked allocation
  bar and a running total that must reach 100% before voting, and a ranked ballot
  with drag-to-reorder plus keyboard-accessible chevrons. Option lists longer than
  8 entries get a filter input and a fixed-height scroll area. The single-choice
  ballot can also show a live impact preview: a per-option bar, voting power and
  share, with the shift the vote would cause on the selected row.

  Adds the off-chain current-results card: ranked per-option tallies with the
  leading option highlighted, shutter-aware encrypted and reveal-pending states
  that show dashes instead of zeros, and an optimistic-vote chip that reports
  indexing progress after a vote is signed.

  Off-chain statuses are now derived on their own terms instead of borrowing the
  on-chain enum, so a Snapshot vote can no longer read "Executed". Basic
  proposals resolve to a quorum-aware Passed or Rejected, every other vote type
  closes with its winner surfaced, and Active is visually distinct from Passed.

- [#2086](https://github.com/blockful/anticapture/pull/2086) [`bcd09f1`](https://github.com/blockful/anticapture/commit/bcd09f177254c1583018ac621f986359f741cd35) Thanks [@brunod-e](https://github.com/brunod-e)! - connecting a wallet no longer signs you in: delegating, voting and publishing a proposal open the wallet picker directly and ask for no SIWE signature, on both Anticapture and whitelabel. A connected wallet without a session is now a valid state (it used to be force-disconnected), and the header connect button opens the wallet picker instead of the login modal. The sign-in modal is still reached from the surfaces that need a server session, such as proposal drafts and API keys. Switching to a different wallet account also takes effect immediately: drafts, API keys and the account chip stop treating the previous account as signed in from that moment, instead of staying usable until the sign-out request comes back

### Patch Changes

- [#2085](https://github.com/blockful/anticapture/pull/2085) [`7ad2cee`](https://github.com/blockful/anticapture/commit/7ad2cee9e347d775420668d5f2cd14678f790bbd) Thanks [@pikonha](https://github.com/pikonha)! - API keys page UX review fixes (ClickUp 86ajr888u): the save-key modal keeps
  the default modal width (same as the create step), drops the key name and the
  em-dash from its description, titles the token block "Key" with a same-size
  "MCP" title below it, and no longer shows the "waiting for the first call"
  status. Switching the client tab animates the code block height. The keys
  table truncates long names with an ellipsis, the usage key switcher is now a
  dropdown with a max width (truncating long names), the empty usage state uses
  the BlankSlate component, and the usage section is shorter. The connect
  section is titled "MCP" with "connect your AI agent" moved into the
  description, and the modal close button is the small version. Long key
  names are truncated in the usage chart tooltip and legend, and the
  stacked-bar-chart legend scrolls instead of wrapping so it no longer
  overflows into the x-axis on mobile.

- [#2095](https://github.com/blockful/anticapture/pull/2095) [`45bf07e`](https://github.com/blockful/anticapture/commit/45bf07efeda51efa0625f36ec3ad35b60448bd7e) Thanks [@pikonha](https://github.com/pikonha)! - Cut 12.7k lines of mocked chart datasets out of the client bundle: delete the unreferenced token-distribution dataset and load the attack-profitability dataset dynamically, only when the research-pending blur is active. Replace the wildcard `next/image` `remotePatterns` with an explicit host allowlist and drop the deprecated `domains` key.

- [#2091](https://github.com/blockful/anticapture/pull/2091) [`6aed140`](https://github.com/blockful/anticapture/commit/6aed1407371c81f075a408992b2ff2a86b97c6c5) Thanks [@pikonha](https://github.com/pikonha)! - Fix Snapshot proposal statuses by indexing quorum data and deriving no-quorum, stale-active, and
  passed states correctly, so Snapshot proposals no longer show on-chain queue states.
- Updated dependencies [[`6aed140`](https://github.com/blockful/anticapture/commit/6aed1407371c81f075a408992b2ff2a86b97c6c5)]:
  - @anticapture/client@2.0.1

## 2.10.0

### Minor Changes

- [#2081](https://github.com/blockful/anticapture/pull/2081) [`dd68b62`](https://github.com/blockful/anticapture/commit/dd68b6246f736a21733db830be9955e96ea77dc7) Thanks [@brunod-e](https://github.com/brunod-e)! - footer now reads About / Docs / Terms of Service / Give Feedback (Docs points to docs.anticapture.com), the API keys page gets a "See our Docs" button and a direct per-row delete button (replacing the options menu), and whitelabel sign-in triggers SIWE directly instead of opening the login modal

- [#2072](https://github.com/blockful/anticapture/pull/2072) [`90a98bc`](https://github.com/blockful/anticapture/commit/90a98bc052455fd28dfdd0fd79351a2a4f815d4c) Thanks [@pikonha](https://github.com/pikonha)! - Add a user-facing 30-day daily request chart for self-service API keys, backed by resilient Gateful usage batching and tenant-scoped Authful storage. Gateful flushes with a new usage-only Authful credential (`USAGE_API_KEY` / `TOKEN_SERVICE_USAGE_API_KEY`) that can only record usage — the internet-facing edge never holds mint/revoke capability.

### Patch Changes

- [#2073](https://github.com/blockful/anticapture/pull/2073) [`ec67a25`](https://github.com/blockful/anticapture/commit/ec67a253f63b85b75085408b60568181b13843f3) Thanks [@pikonha](https://github.com/pikonha)! - Route wallet RPC transports exclusively through a server-side proxy that requires authenticated eRPC configuration without exposing the secret to browsers.

- [#2082](https://github.com/blockful/anticapture/pull/2082) [`4004db5`](https://github.com/blockful/anticapture/commit/4004db5382579c1f08fadf835544dec945b49b23) Thanks [@pikonha](https://github.com/pikonha)! - Show ready-to-copy AI agent connection commands while newly created API keys are still available.

- [#2079](https://github.com/blockful/anticapture/pull/2079) [`f40e9bd`](https://github.com/blockful/anticapture/commit/f40e9bd59f53dcb64ff5ecf34c0cda25e56269bf) Thanks [@pikonha](https://github.com/pikonha)! - fix panel height overflow

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
