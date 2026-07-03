---
"@anticapture/api": patch
---

Fix Shutter (SHU) timelock period: `Azorius.timelockPeriod()` is 14400 blocks (~2 days), not zero. Corrects the `timelockDelay` reported by the DAO endpoint, and surfaces the Azorius post-voting lifecycle in proposal status: passed proposals now report `QUEUED` during the timelock window (when `executeProposal` would revert) and `PENDING_EXECUTION` during the execution window, instead of `SUCCEEDED` throughout. Status filters for `QUEUED`/`PENDING_EXECUTION` now also match Azorius proposals.
