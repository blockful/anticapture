# @anticapture/offchain-indexer

## 1.1.1

### Patch Changes

- [#2053](https://github.com/blockful/anticapture/pull/2053) [`633b628`](https://github.com/blockful/anticapture/commit/633b6287869693b8c707677d7b0af62a4b2c6ad7) Thanks [@pikonha](https://github.com/pikonha)! - add pg pool config to avoid hanging db connections

## 1.1.0

### Minor Changes

- [#1998](https://github.com/blockful/anticapture/pull/1998) [`7f62a0e`](https://github.com/blockful/anticapture/commit/7f62a0ee0fafdc5f403f97c1bbd0a50eb96c66bf) Thanks [@pikonha](https://github.com/pikonha)! - Remove proposals and votes from the offchain indexer database when proposals are deleted from Snapshot. Reconciliation is bounded to proposals created in the last two weeks, so it never deletes older proposals and avoids overwhelming the Snapshot API and the indexer.
