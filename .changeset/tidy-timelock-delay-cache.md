---
"@anticapture/api": patch
---

Dedupe concurrent timelock delay RPC reads in GovernorBase, fall back to the indexed proposal status when RPC reads fail (e.g. rate limits) instead of returning 500, and include the error cause in the unhandled-error log message.
