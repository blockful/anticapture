---
"@anticapture/api": patch
---

Serve proposals without waiting on RPC: the latest block is refreshed stale-while-revalidate (bounded to 60s of
staleness, after which requests wait for the RPC again) and requests fall back to the indexed proposal status
when the RPC is down instead of failing.
