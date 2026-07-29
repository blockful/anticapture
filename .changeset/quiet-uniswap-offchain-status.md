---
"@anticapture/api": patch
"@anticapture/gateful": patch
"@anticapture/client": patch
"@anticapture/dashboard": patch
"@anticapture/offchain-indexer": patch
---

Fix Snapshot proposal statuses by indexing quorum data and deriving no-quorum, stale-active, and
passed states correctly, so Snapshot proposals no longer show on-chain queue states.
