---
"@anticapture/api": minor
"@anticapture/gateful": minor
"@anticapture/client": major
---

Remove the draft-proposal endpoints from the DAO APIs — drafts now live in the User API (user-scoped, session-authenticated). The `/{dao}/proposal/drafts*` routes, their controller/service/repository/mappers, and the `general` Postgres schema wiring are gone from `@anticapture/api`; the gateway spec and the generated `@anticapture/client` SDK no longer expose any `Draft*` fetchers, hooks, MCP tools, or models (breaking for external SDK consumers). The physical `general.proposal_drafts` table is left intact in each DAO database for the one-shot migration into the User API; a follow-up drops it.
