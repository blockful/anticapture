---
"@anticapture/api": patch
---

Revenue, token price, treasury and token properties serve the last known or empty data instead of 5xx when Dune or
CoinGecko is unhealthy, and count it on degraded_upstream_responses_total; fix the FLUID CoinGecko id.
