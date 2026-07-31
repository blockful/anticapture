# @anticapture/offchain-indexer

## 1.1.2

### Patch Changes

- [#2087](https://github.com/blockful/anticapture/pull/2087) [`83c5e75`](https://github.com/blockful/anticapture/commit/83c5e752943e156a243a2438996034fa1abb2eae) Thanks [@brunod-e](https://github.com/brunod-e)! - Re-ingest Shutter-encrypted proposals once their votes are revealed. Both sync
  passes walk forward only by creation time, and a Shutter proposal reveals its
  tally after voting closes, so the cursors had already moved past it and the
  encrypted zero tally was never replaced. Closed Shutter elections showed
  0 / 0.0% permanently. Each cycle now re-reads proposals whose voting ended
  inside the reconciliation window and whose tally is still all zeros, along with
  their votes, and upserts them without advancing either cursor.

  The scan is bounded on the proposal's end time rather than its creation time, so
  a proposal that ran for longer than the window is still picked up once it closes.
  The vote re-read pages inclusively by timestamp and de-dupes per voter, so
  revealed votes sharing a second across a page boundary are no longer dropped.

- [#2091](https://github.com/blockful/anticapture/pull/2091) [`6aed140`](https://github.com/blockful/anticapture/commit/6aed1407371c81f075a408992b2ff2a86b97c6c5) Thanks [@pikonha](https://github.com/pikonha)! - Fix Snapshot proposal statuses by indexing quorum data and deriving no-quorum, stale-active, and
  passed states correctly, so Snapshot proposals no longer show on-chain queue states.

## 1.1.1

### Patch Changes

- [#2053](https://github.com/blockful/anticapture/pull/2053) [`633b628`](https://github.com/blockful/anticapture/commit/633b6287869693b8c707677d7b0af62a4b2c6ad7) Thanks [@pikonha](https://github.com/pikonha)! - add pg pool config to avoid hanging db connections

## 1.1.0

### Minor Changes

- [#1998](https://github.com/blockful/anticapture/pull/1998) [`7f62a0e`](https://github.com/blockful/anticapture/commit/7f62a0ee0fafdc5f403f97c1bbd0a50eb96c66bf) Thanks [@pikonha](https://github.com/pikonha)! - Remove proposals and votes from the offchain indexer database when proposals are deleted from Snapshot. Reconciliation is bounded to proposals created in the last two weeks, so it never deletes older proposals and avoids overwhelming the Snapshot API and the indexer.
