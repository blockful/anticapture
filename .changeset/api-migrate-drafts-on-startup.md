---
"@anticapture/api": patch
---

Run pending `general` schema migrations on API startup so the `proposal_drafts` table exists in fresh databases, preventing draft proposal endpoints from returning 500s on new preview/production environments.
