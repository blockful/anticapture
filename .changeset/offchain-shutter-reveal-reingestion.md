---
"@anticapture/offchain-indexer": patch
---

Re-ingest Shutter-encrypted proposals once their votes are revealed. Both sync
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
