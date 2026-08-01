# @anticapture/offchain-indexer

## 1.1.3

### Patch Changes

- [#2093](https://github.com/blockful/anticapture/pull/2093) [`a8ff095`](https://github.com/blockful/anticapture/commit/a8ff09574d94a73b944db87c37587daf96a4891a) Thanks [@pikonha](https://github.com/pikonha)! - Stop the proposal and vote sync streams from dropping rows at a page boundary that falls inside a `created` second. Both queries now filter with `created_gte` (writes upsert, so re-reading the boundary is idempotent) and page deeper with `skip` when a whole page lands on one second — the only case where the cursor cannot advance without losing rows. The four copies of that pagination logic now share one helper.

- [#2084](https://github.com/blockful/anticapture/pull/2084) [`36c4f58`](https://github.com/blockful/anticapture/commit/36c4f589702100fb4a5b16c3611ee04a427023c2) Thanks [@brunod-e](https://github.com/brunod-e)! - Keep paginating through same-second bursts when re-reading Snapshot proposals and votes: a page that lands entirely on one `created` second now advances with `skip` instead of stepping to the next second, which silently dropped every row past the first page — leaving revealed Shutter votes stuck with their encrypted choices.

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
