---
"@anticapture/indexer": patch
---

Fix TORN voting power going negative from treasury transfers. TORN derives per-account voting power from lock/unlock Transfers in/out of the governor, but TORN also flows through the governor for treasury purposes (proposal executions, batch grant payouts, the governor↔vault migration). Those were misread as user unlocks and subtracted voting power from recipients that never locked (e.g. proposal #6 funding a staking pool booked a -120k unlock against a contract with zero locked balance), producing negative voting power and phantom locked balances. A custody transfer is now only counted as a lock/unlock when its counterparty is the transaction sender, which is true for genuine `lock()`/`unlock()` calls and false for treasury flows.
