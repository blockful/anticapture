---
"@anticapture/gateful": patch
---

Token metrics items gain a `close` field: the value at the end of the UTC day, forward-filled on days without activity. `high` keeps its meaning. Regenerate @anticapture/client from this spec.
