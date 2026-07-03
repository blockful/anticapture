# @anticapture/offchain-indexer

## 1.1.0

### Minor Changes

- [#1998](https://github.com/blockful/anticapture/pull/1998) [`7f62a0e`](https://github.com/blockful/anticapture/commit/7f62a0ee0fafdc5f403f97c1bbd0a50eb96c66bf) Thanks [@pikonha](https://github.com/pikonha)! - Remove proposals and votes from the offchain indexer database when proposals are deleted from Snapshot. Reconciliation is bounded to proposals created in the last two weeks, so it never deletes older proposals and avoids overwhelming the Snapshot API and the indexer.
