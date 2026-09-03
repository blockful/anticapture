# @anticapture/api

## 1.8.1

### Patch Changes

- [#2147](https://github.com/blockful/anticapture/pull/2147) [`8d2bc23`](https://github.com/blockful/anticapture/commit/8d2bc2387945338fe7011a2b45ae578579690fa2) Thanks [@brunod-e](https://github.com/brunod-e)! - Fix the Aave stakeholders page timing out by scoping the voting-power and balance listing aggregations to the requested page.

- [#2152](https://github.com/blockful/anticapture/pull/2152) [`347b620`](https://github.com/blockful/anticapture/commit/347b620b4b92ae3561f226074e8fd58351be045a) Thanks [@pikonha](https://github.com/pikonha)! - Push the `lean` query param down to SQL for `GET /proposals/search` and `GET /proposals/{id}`, so description/calldatas/values/targets are no longer selected just to be dropped by the mapper. Response shape is unchanged.

## 1.8.0

### Minor Changes

- [#2084](https://github.com/blockful/anticapture/pull/2084) [`3af2f54`](https://github.com/blockful/anticapture/commit/3af2f542ad10c1e944f76510d8c65d46ab910654) Thanks [@brunod-e](https://github.com/brunod-e)! - `GET /:dao/feed/events` accepts `relevance=ALL`, which drops the value threshold and returns every event instead of only those at or above a tier. The relevance tiers are cumulative value floors (LOW already includes MEDIUM and HIGH), so there was previously no way to ask for events below the LOW floor. Omitting the param still defaults to MEDIUM, so existing consumers are unaffected.

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

### Patch Changes

- [#2098](https://github.com/blockful/anticapture/pull/2098) [`002b33c`](https://github.com/blockful/anticapture/commit/002b33ca39cd7e2aaa5373732fe02aa09a25dd93) Thanks [@pikonha](https://github.com/pikonha)! - Stop the production dashboard build from generating its SDK against the
  previous release's OpenAPI spec.

  Gateful merges the DAO APIs' specs into `/docs/json` on every request, so the
  deploy gate waiting for gateful's own commit proved nothing about the schemas
  it would serve: on [#2093](https://github.com/blockful/anticapture/issues/2093) gateful reported the new commit at 14:33:54, codegen
  read the spec at 14:34:23, and `ens-api` only came up at 14:34:34 — the
  dashboard build failed on a field the API hadn't started advertising yet.

  Every service whose OpenAPI gateful merges into `/docs/json` — the DAO APIs,
  the relayer and address enrichment — now reports its running commit on
  `/health`, and gateful passes it through as `upstreams.<name>.commit` alongside
  an `upstreams.<name>.kind`. `scripts/wait-for-gateful.mjs` then holds the
  deploy until each of them reports a commit listed for its kind in
  `EXPECTED_UPSTREAM_SHAS`: the last commit that touched the paths Railway
  watches to rebuild that service, plus everything after it.

  Expressing it as "that commit or newer" per service, rather than "does this
  push change the API", keeps the gate correct when a push that leaves a service
  alone supersedes an in-flight push that changed it, and when a push carries
  more than one commit. An upstream reporting no commit counts as stale — the
  previous release is still answering — which cannot deadlock, because teaching a
  service to report its commit necessarily touches its own watched paths.
  Authful contributes no merged schemas and only has to be reachable.

  `@anticapture/client#codegen` is also no longer cached by turbo: its real input
  is a live URL no hash can see, so the poisoned output above was replayed on
  every retry of that commit and no re-run could ever fix it. `#build` had to go
  with it: tsup runs with `dts: true`, so that same unhashable spec is compiled
  into `dist`, and a retry that re-ran codegen would restore the stale `dist`
  straight over the freshly generated output. Declaring `generated/**` as an
  input does not close this — turbo hashes inputs before the run, and the
  directory is gitignored, so on a fresh checkout it is still empty at the moment
  the hash is taken.

## 1.7.0

### Minor Changes

- [#2087](https://github.com/blockful/anticapture/pull/2087) [`989b5e5`](https://github.com/blockful/anticapture/commit/989b5e5a9a8f307a920f9922941945afb33c5b01) Thanks [@brunod-e](https://github.com/brunod-e)! - Expose per-choice weights on off-chain votes. Weighted and quadratic ballots are
  stored as `{choiceIndex: weight}`, but the response reduced that to the choice
  indices and discarded the weights, so a voter's split could not be read back.
  Off-chain votes now also carry a `weights` object, null for vote types that have
  no weights. `choice` is unchanged.

### Patch Changes

- [#2091](https://github.com/blockful/anticapture/pull/2091) [`6aed140`](https://github.com/blockful/anticapture/commit/6aed1407371c81f075a408992b2ff2a86b97c6c5) Thanks [@pikonha](https://github.com/pikonha)! - Fix Snapshot proposal statuses by indexing quorum data and deriving no-quorum, stale-active, and
  passed states correctly, so Snapshot proposals no longer show on-chain queue states.

## 1.6.1

### Patch Changes

- [#2079](https://github.com/blockful/anticapture/pull/2079) [`a7ae338`](https://github.com/blockful/anticapture/commit/a7ae33870774dffb2ab82822212d5e4e4fde8627) Thanks [@pikonha](https://github.com/pikonha)! - remove canceled proposals from the activity

## 1.6.0

### Minor Changes

- [#2051](https://github.com/blockful/anticapture/pull/2051) [`fe815fe`](https://github.com/blockful/anticapture/commit/fe815fe4b4fd25e6fa44dd2cf353833fd83d4f4e) Thanks [@brunod-e](https://github.com/brunod-e)! - Remove the draft-proposal endpoints from the DAO APIs — drafts now live in the User API (user-scoped, session-authenticated). The `/{dao}/proposal/drafts*` routes, their controller/service/repository/mappers, and the `general` Postgres schema wiring are gone from `@anticapture/api`; the gateway spec and the generated `@anticapture/client` SDK no longer expose any `Draft*` fetchers, hooks, MCP tools, or models (breaking for external SDK consumers). The physical `general.proposal_drafts` table is left intact in each DAO database for the one-shot migration into the User API; a follow-up drops it.

## 1.5.5

### Patch Changes

- [#2064](https://github.com/blockful/anticapture/pull/2064) [`a28e99f`](https://github.com/blockful/anticapture/commit/a28e99f5f7974437a6ba038106cb380984080f5f) Thanks [@pikonha](https://github.com/pikonha)! - Dedupe concurrent timelock delay RPC reads in GovernorBase, fall back to the indexed proposal status when RPC reads fail (e.g. rate limits) instead of returning 500, and include the error cause in the unhandled-error log message.

## 1.5.4

### Patch Changes

- [#2060](https://github.com/blockful/anticapture/pull/2060) [`b7df0bb`](https://github.com/blockful/anticapture/commit/b7df0bb80e90a55e94bbf05aaeec8e6769212c4f) Thanks [@pikonha](https://github.com/pikonha)! - Preserve voting-power history pagination when transactions contain partial delegations.

## 1.5.3

### Patch Changes

- [#2031](https://github.com/blockful/anticapture/pull/2031) [`4e6c3eb`](https://github.com/blockful/anticapture/commit/4e6c3ebcc3d527d1e90059bc00ff3d38ed4f6655) Thanks [@pikonha](https://github.com/pikonha)! - improve performance of the voting power historical endpoint

- [#2055](https://github.com/blockful/anticapture/pull/2055) [`248a451`](https://github.com/blockful/anticapture/commit/248a4518fd7d22c24ceaa23ad4692e1a5cb18aa6) Thanks [@pikonha](https://github.com/pikonha)! - Make request log messages human-readable in Loki (`GET /path 200` instead of `request`) and stop logging `/metrics` and `/health` scrapes

- [#2056](https://github.com/blockful/anticapture/pull/2056) [`1051a2d`](https://github.com/blockful/anticapture/commit/1051a2d698b74c95219df903862ed3afe658c514) Thanks [@pikonha](https://github.com/pikonha)! - enable offchain (Snapshot) proposal data for ShutterDAO

- [#2053](https://github.com/blockful/anticapture/pull/2053) [`633b628`](https://github.com/blockful/anticapture/commit/633b6287869693b8c707677d7b0af62a4b2c6ad7) Thanks [@pikonha](https://github.com/pikonha)! - add pg pool config to avoid hanging db connections

## 1.5.2

### Patch Changes

- [#2023](https://github.com/blockful/anticapture/pull/2023) [`7ba3449`](https://github.com/blockful/anticapture/commit/7ba344927fc8546ac79d4efa99b5be6cedfc4aec) Thanks [@brunod-e](https://github.com/brunod-e)! - Fix `/token/historical-data` returning 500 for NFT-priced DAOs (Nouns, Lil Nouns): the rolling-average SQL emitted decimal strings that crashed the wei-to-USD conversion, which in turn tripped the gateway circuit breaker and made the whole DAO unavailable.

## 1.5.1

### Patch Changes

- [#2029](https://github.com/blockful/anticapture/pull/2029) [`1b9aef0`](https://github.com/blockful/anticapture/commit/1b9aef01669aacac2c4923aafde183e607328381) Thanks [@pikonha](https://github.com/pikonha)! - improve perfomance of the proposals endpoint

- [#1979](https://github.com/blockful/anticapture/pull/1979) [`2ea392e`](https://github.com/blockful/anticapture/commit/2ea392ea9c6b0ce44466f0eee14f476eedfd2bd7) Thanks [@Zeugh-eth](https://github.com/Zeugh-eth)! - Fix Shutter (SHU) timelock period: `Azorius.timelockPeriod()` is 14400 blocks (~2 days), not zero. Corrects the `timelockDelay` reported by the DAO endpoint, and surfaces the Azorius post-voting lifecycle in proposal status: passed proposals now report `QUEUED` during the timelock window (when `executeProposal` would revert) and `PENDING_EXECUTION` during the execution window, instead of `SUCCEEDED` throughout. Status filters for `QUEUED`/`PENDING_EXECUTION` now also match Azorius proposals.

- [#2025](https://github.com/blockful/anticapture/pull/2025) [`95b15e6`](https://github.com/blockful/anticapture/commit/95b15e69c30f5c2d9e4cd0e594212ec19bfeedd8) Thanks [@pikonha](https://github.com/pikonha)! - Fix SQL injection pattern in proposals-activity repository: proposal IDs in the getUserVotes IN clause are now bound parameters instead of string-interpolated raw SQL

## 1.5.0

### Minor Changes

- [#2002](https://github.com/blockful/anticapture/pull/2002) [`451db65`](https://github.com/blockful/anticapture/commit/451db65d6497503ecebcae24fed44027a2e6479f) Thanks [@pikonha](https://github.com/pikonha)! - Integrate Tornado Cash DAO (TORN): custom stake-to-vote indexer (lock-based delegated supply, timestamp governance), timestamp-based proposal-status API client, and dashboard config/icon.

### Patch Changes

- [#2002](https://github.com/blockful/anticapture/pull/2002) [`2f0aca6`](https://github.com/blockful/anticapture/commit/2f0aca60e1a4785af8d7f52cd81c6a3cfbac63ee) Thanks [@pikonha](https://github.com/pikonha)! - Return unsupported-offchain errors consistently across offchain proposal and vote routes.

- [#2002](https://github.com/blockful/anticapture/pull/2002) [`873bb45`](https://github.com/blockful/anticapture/commit/873bb4514e144aaece91246c86ba61e0e7f54c1f) Thanks [@pikonha](https://github.com/pikonha)! - Normalize TORN lock/unlock transfer direction in voting-power history so the locker (not the custody contract) is shown as the delegator.

- [#2002](https://github.com/blockful/anticapture/pull/2002) [`2fc7174`](https://github.com/blockful/anticapture/commit/2fc71740f3953d5c49eaf92d5ab7947ae821ce0f) Thanks [@pikonha](https://github.com/pikonha)! - Fix TORN historical voting power rows being rendered as bogus zero-address delegations. TORN derives voting power directly from Transfers, so each history row shares the Transfer's log index, which the generic repository's strict `<` join never matched. Added a dedicated TORN voting-power repository that links the causing event at `logIndex <= row logIndex`. Dashboard also formats the auto-delegation fallback amount instead of dumping the raw delta.

## 1.4.0

### Minor Changes

- [#1910](https://github.com/blockful/anticapture/pull/1910) [`a006283`](https://github.com/blockful/anticapture/commit/a0062835b784f0b97363c664ab7efb3ee4177171) Thanks [@brunod-e](https://github.com/brunod-e)! - feat(draft-proposals): persist draft proposals in PostgreSQL with SIWE authentication

  Moves draft proposal storage from browser localStorage to the API's PostgreSQL database. Adds SIWE-based JWT authentication endpoints (`GET /auth/nonce`, `POST /auth/verify`) and full CRUD endpoints for draft proposals (`/proposal/drafts`). On wallet connect, existing localStorage drafts are automatically migrated to the database. Drafts are scoped per user address and DAO.

### Patch Changes

- [#1982](https://github.com/blockful/anticapture/pull/1982) [`1ff97fd`](https://github.com/blockful/anticapture/commit/1ff97fdec92883f54177ce751e78167df24d1696) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Add info logs to all external RPC and HTTP calls (governor contract reads, CoinGecko, Dune, DefiLlama, Compound) for better observability.

- [#1986](https://github.com/blockful/anticapture/pull/1986) [`fb75b11`](https://github.com/blockful/anticapture/commit/fb75b1156cce63c44ebfa361898d339d48a5b266) Thanks [@brunod-e](https://github.com/brunod-e)! - Run pending `general` schema migrations on API startup so the `proposal_drafts` table exists in fresh databases, preventing draft proposal endpoints from returning 500s on new preview/production environments.

- [#1988](https://github.com/blockful/anticapture/pull/1988) [`bc13205`](https://github.com/blockful/anticapture/commit/bc13205f403d8610bed729af23891871e4ccba53) Thanks [@pikonha](https://github.com/pikonha)! - create proposal draft table only if does not exists

## 1.3.2

### Patch Changes

- [#1960](https://github.com/blockful/anticapture/pull/1960) [`672bfd2`](https://github.com/blockful/anticapture/commit/672bfd29fdabeca0d22f603a49cb5cb1286b81df) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Fix and enhance OpenAPI docstrings on REST controllers: correct the "a the" grammar in the account-balance and voting-power variations descriptions, fix the `GET /proposals` 200 response description that mislabeled the payload as "proposals activity", and add missing endpoint descriptions across governance-activity, token-distribution, delegation-percentage, event-relevance, feed, last-update, and the gateful daos/health/average-delegation routes.

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
