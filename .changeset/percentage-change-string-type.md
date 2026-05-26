---
"@anticapture/api": patch
---

Drop the `format: "bigint"` annotation from `percentageChange` on
`AccountBalanceVariation` and `VotingPowerVariation`. The field carries a
decimal-string percentage (or the `"NO BASELINE"` sentinel when the previous
period is zero) — it was never a bigint, and the wrong tag made generated
TS clients type it as `bigint`, which broke sentinel comparisons downstream.
