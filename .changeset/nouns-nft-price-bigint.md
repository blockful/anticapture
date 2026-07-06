---
"@anticapture/api": patch
---

Fix `/token/historical-data` returning 500 for NFT-priced DAOs (Nouns, Lil Nouns): the rolling-average SQL emitted decimal strings that crashed the wei-to-USD conversion, which in turn tripped the gateway circuit breaker and made the whole DAO unavailable.
