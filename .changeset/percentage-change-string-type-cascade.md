---
"@anticapture/gateful": patch
"@anticapture/api-gateway": patch
---

Regenerate API contracts to pick up the corrected `percentageChange` type
(plain string, no bigint format) on `AccountBalanceVariation` and
`VotingPowerVariation`.
