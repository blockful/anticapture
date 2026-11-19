---
"@anticapture/api": patch
---

Revenue results from Dune are now cached for 6 hours instead of 24. With the queries refreshed daily, the data served stays at most about 30 hours old, under the 36-hour "Data delayed" threshold; the 24-hour cache let it reach 48 hours on a normal day.
