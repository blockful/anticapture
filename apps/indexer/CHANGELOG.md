# @anticapture/indexer

## 1.2.0

### Minor Changes

- [#2002](https://github.com/blockful/anticapture/pull/2002) [`0d2da65`](https://github.com/blockful/anticapture/commit/0d2da6586a227f7c5382726144be1ea9797fd25e) Thanks [@pikonha](https://github.com/pikonha)! - TORN: route locked voting power to the locker's delegate and move it between delegates on Delegated/Undelegated. TORN emits no DelegateVotesChanged, so per-account voting power is now fully synthesized from lock/unlock Transfers plus delegation shifts.

- [#2002](https://github.com/blockful/anticapture/pull/2002) [`451db65`](https://github.com/blockful/anticapture/commit/451db65d6497503ecebcae24fed44027a2e6479f) Thanks [@pikonha](https://github.com/pikonha)! - Integrate Tornado Cash DAO (TORN): custom stake-to-vote indexer (lock-based delegated supply, timestamp governance), timestamp-based proposal-status API client, and dashboard config/icon.

### Patch Changes

- [#2002](https://github.com/blockful/anticapture/pull/2002) [`1454329`](https://github.com/blockful/anticapture/commit/14543297f18e5992825b0a31f492ec78bc7fa935) Thanks [@pikonha](https://github.com/pikonha)! - Fix TORN voting power going negative from treasury transfers. TORN derives per-account voting power from lock/unlock Transfers in/out of the governor, but TORN also flows through the governor for treasury purposes (proposal executions, batch grant payouts, the governor↔vault migration). Those were misread as user unlocks and subtracted voting power from recipients that never locked (e.g. proposal [#6](https://github.com/blockful/anticapture/issues/6) funding a staking pool booked a -120k unlock against a contract with zero locked balance), producing negative voting power and phantom locked balances. A custody transfer is now only counted as a lock/unlock when its counterparty is the transaction sender, which is true for genuine `lock()`/`unlock()` calls and false for treasury flows.

- [#2002](https://github.com/blockful/anticapture/pull/2002) [`1a91eb5`](https://github.com/blockful/anticapture/commit/1a91eb56fce13083adb903b28afed971f28fdfb7) Thanks [@pikonha](https://github.com/pikonha)! - Fix TORN votes not reflecting vote changes. TORN's governor lets a voter re-cast to change their vote, but the `Voted` handler used `onConflictDoNothing` on the unique `(voter, proposal)` row and dropped every subsequent cast — so a voter who switched from For to Against still showed as For and the proposal tally kept the stale vote. The handler now overwrites the existing row and moves the voting power between the for/against buckets on a change, while still treating an exact re-processed log (backfill/reorg) as a no-op. Requires a reindex to repopulate.

## 1.1.0

### Minor Changes

- [#1875](https://github.com/blockful/anticapture/pull/1875) [`cb90c89`](https://github.com/blockful/anticapture/commit/cb90c8941e32c352ef84eb3b3e45298c1233f4ff) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Migrate feed event metadata from a denormalized `feed_event.metadata` JSON column to query-time synthesis against `proposals_onchain`, `votes_onchain`, `delegations`, `transfers`, and `voting_power_history`. Adds discriminated metadata schemas to the OpenAPI contract, supports multi-type filtering on `/feed/events`, and wires the dashboard event-type filter as a multi-select.
