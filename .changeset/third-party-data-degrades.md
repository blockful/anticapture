---
"@anticapture/api": patch
---

Revenue, token price and treasury serve the last known or empty data instead of 5xx when Dune or CoinGecko is
unhealthy, token properties keep the last known price, all counted on degraded_upstream_responses_total; fix the FLUID CoinGecko id.
