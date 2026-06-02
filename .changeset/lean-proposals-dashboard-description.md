---
"@anticapture/dashboard": patch
---

Adapt the governance UI to the new `variant`-tagged onchain proposals response: narrow the SDK union to the `full` variant in the proposal hooks, search adapter, and detail page (the dashboard always requests the full payload).
