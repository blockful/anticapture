---
"@anticapture/indexer": minor
---

TORN: route locked voting power to the locker's delegate and move it between delegates on Delegated/Undelegated. TORN emits no DelegateVotesChanged, so per-account voting power is now fully synthesized from lock/unlock Transfers plus delegation shifts.
