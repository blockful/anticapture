---
"@anticapture/gateful": patch
---

Fix a silent-failure mode in Gateful's per-token usage tracking. A request to a path whose normalized route could break the buffer key (or otherwise produce an entry Authful rejects) made `/usage/batch` return 400; the tracker re-buffered on every error, so the whole buffer got stuck retrying a payload that would never be accepted — usage tracking silently stopped and the buffer grew unbounded until restart. Three independent guards now break that chain: non-DAO route segments bucket to `/unknown` (bounded cardinality, mirroring the cache middleware), the flush buffer uses a structured key instead of a `|`-joined string (routes round-trip verbatim), and a 4xx from Authful drops the batch while only network/5xx failures re-buffer.
