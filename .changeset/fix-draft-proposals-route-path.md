---
"@anticapture/api": patch
"@anticapture/gateful": patch
---

Fix the draft-proposals route path, which a prior codegen refactor accidentally changed from `/proposal-drafts` to `/proposal/drafts`. The hyphenated form is restored to match the original contract, the integration tests, and the rest of the API's resource naming convention (e.g. `/proposals-activity`, `/delegation-percentage`).
