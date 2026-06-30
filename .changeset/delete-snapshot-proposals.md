---
"@anticapture/offchain-indexer": minor
---

Remove proposals and votes from the offchain indexer database when proposals are deleted from Snapshot. Reconciliation is bounded to proposals created in the last two weeks, so it never deletes older proposals and avoids overwhelming the Snapshot API and the indexer.
