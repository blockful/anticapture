---
"@anticapture/api": patch
---

Serve proposals without waiting on RPC: the latest block is refreshed stale-while-revalidate and
requests fall back to the indexed proposal status when the RPC is down instead of failing.
