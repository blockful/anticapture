---
"@anticapture/api": patch
---

Revenue (Dune) and token price history (CoinGecko) serve the last known or empty data instead of 5xx when the
provider fails, so a third-party outage no longer trips the gateway circuit breaker; fix the FLUID CoinGecko id.
