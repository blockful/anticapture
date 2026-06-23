---
"@anticapture/api": patch
---

Fix Shutter (SHU) timelock period: `Azorius.timelockPeriod()` is 14400 blocks (~2 days), not zero. Corrects the `timelockDelay` reported by the DAO endpoint and the execution window used when computing `EXPIRED` proposal status.
