---
---

chore: add a local dev-stack lane for the User API (`scripts/dev.sh`) + `pnpm user-api` root alias. Optional, mirroring Address Enrichment — runs via `railway run` when the service is available and exports `USER_API_URL` for the dashboard `/api/user` proxy; skipped otherwise so existing flows are unaffected.
