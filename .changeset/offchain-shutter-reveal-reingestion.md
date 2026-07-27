---
"@anticapture/offchain-indexer": patch
---

Re-ingest Shutter-encrypted proposals once their votes are revealed. Both sync
passes walk forward only by creation time, and a Shutter proposal reveals its
tally after voting closes, so the cursors had already moved past it and the
encrypted zero tally was never replaced. Closed Shutter elections showed
0 / 0.0% permanently. Each cycle now re-reads closed proposals whose tally is
still all zeros, along with their votes, and upserts them without advancing
either cursor.
