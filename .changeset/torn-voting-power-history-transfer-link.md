---
"@anticapture/api": patch
"@anticapture/dashboard": patch
---

Fix TORN historical voting power rows being rendered as bogus zero-address delegations. TORN derives voting power directly from Transfers, so each history row shares the Transfer's log index, which the generic repository's strict `<` join never matched. Added a dedicated TORN voting-power repository that links the causing event at `logIndex <= row logIndex`. Dashboard also formats the auto-delegation fallback amount instead of dumping the raw delta.
