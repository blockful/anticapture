---
"@anticapture/user-api": minor
---

New user identity & session service (`apps/user-api`). Provides SIWE
authentication via better-auth (EOA + EIP-1271, per-host domain resolution for
whitelabel) and session-scoped draft proposals: identity comes from the
session cookie, drafts are keyed by user with a `daoId` filter, the share
endpoint is public with a server-derived `isOwner`, and migrated rows are
claimed on first sign-in. Reached only through the dashboard's `/api/user`
proxy, independent of Gateful.
