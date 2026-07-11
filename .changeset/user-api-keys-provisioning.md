---
"@anticapture/authful": minor
"@anticapture/user-api": minor
---

Add self-service API keys (DEV-950). Authful gains an optional scoped provisioning key that may only mint/revoke `user:*` tenants and cannot list all tenants (the admin key stays unrestricted). The User API brokers end-user keys through it: `POST/GET/DELETE /me/api-keys` (session-authenticated) mint into Authful under tenant `user:<userId>`, return the plaintext exactly once, and store only ownership (never the secret) — with a per-user quota and Authful-first revocation. Both surfaces stay disabled until their env is configured.
