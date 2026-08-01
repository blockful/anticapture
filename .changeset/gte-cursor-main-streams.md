---
"@anticapture/offchain-indexer": patch
---

Stop the proposal and vote sync streams from dropping rows at a page boundary that falls inside a `created` second. Both queries now filter with `created_gte` (writes upsert, so re-reading the boundary is idempotent) and page deeper with `skip` when a whole page lands on one second — the only case where the cursor cannot advance without losing rows. The four copies of that pagination logic now share one helper.
