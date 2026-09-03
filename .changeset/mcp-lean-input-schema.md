---
"@anticapture/client": patch
---

Make `lean` an honored default on the MCP proposal tools instead of a hardcoded override. The tools used to force `lean: true` while still advertising the param with `default: false`, so a caller asking for the full payload was silently ignored. They now re-declare `lean` with a `true` default (keeping MCP responses small) and pass the caller's value through, so `lean: false` returns the full proposal — calldatas, values, targets and description/body.
