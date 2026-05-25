---
"@anticapture/api": patch
---

Stop capping the delegation-percentage repository read at `(limit + 1) * 2`.
The service builds a forward-filled timeline across the full requested date
window and only then paginates with `skip`/`limit`. Capping the upstream
read would drop later metric changes, freezing stale values across the tail
of the timeline and returning incorrect data on later `skip` pages.
