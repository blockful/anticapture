---
"@anticapture/relayer": minor
---

Add GET /relay/status, which answers whether gasless relaying can be used right now from every check the relayer can run on itself (pause switch, RPC reachability and chain, wallet balance, rate limiter, stuck pending transactions, repeated broadcast failures) and always answers 200 with the failed checks listed as reasons, and add the GASLESS_PAUSED kill switch, which refuses every relayed vote, delegation, queue and execute with 503 RELAYER_PAUSED before a signature is recovered or the chain is read, and keeps webhook-driven enactment from broadcasting
