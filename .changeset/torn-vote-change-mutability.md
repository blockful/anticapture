---
"@anticapture/indexer": patch
---

Fix TORN votes not reflecting vote changes. TORN's governor lets a voter re-cast to change their vote, but the `Voted` handler used `onConflictDoNothing` on the unique `(voter, proposal)` row and dropped every subsequent cast — so a voter who switched from For to Against still showed as For and the proposal tally kept the stale vote. The handler now overwrites the existing row and moves the voting power between the for/against buckets on a change, while still treating an exact re-processed log (backfill/reorg) as a no-op. Requires a reindex to repopulate.
