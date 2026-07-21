# @anticapture/user-api

## 0.1.0

### Minor Changes

- [#2044](https://github.com/blockful/anticapture/pull/2044) [`b1c8e28`](https://github.com/blockful/anticapture/commit/b1c8e28f961ecf64d267194b6759f2121d466658) Thanks [@brunod-e](https://github.com/brunod-e)! - Add self-service API keys (DEV-950). Authful gains an optional scoped provisioning key that may only mint/revoke `user:*` tenants and cannot list all tenants (the admin key stays unrestricted). The User API brokers end-user keys through it: `POST/GET/DELETE /me/api-keys` (session-authenticated) mint into Authful under tenant `user:<userId>`, return the plaintext exactly once, and store only ownership (never the secret) — with a per-user quota and Authful-first revocation. Both surfaces stay disabled until their env is configured.

- [#2044](https://github.com/blockful/anticapture/pull/2044) [`52e20ab`](https://github.com/blockful/anticapture/commit/52e20ab7289dc6554cdf3961df1b5132980cb699) Thanks [@brunod-e](https://github.com/brunod-e)! - New user identity & session service (`apps/user-api`). Provides SIWE
  authentication via better-auth (EOA + EIP-1271, per-host domain resolution for
  whitelabel) and session-scoped draft proposals: identity comes from the
  session cookie, drafts are keyed by user with a `daoId` filter, the share
  endpoint is public with a server-derived `isOwner`, and migrated rows are
  claimed on first sign-in. Reached only through the dashboard's `/api/user`
  proxy, independent of Gateful.

### Patch Changes

- [#2071](https://github.com/blockful/anticapture/pull/2071) [`29cd22f`](https://github.com/blockful/anticapture/commit/29cd22f21caf0e2d1be6ba5f0ca6b7f519afcba3) Thanks [@brunod-e](https://github.com/brunod-e)! - Magic-link email restyled to match the Anticapture dashboard theme (dark surface, tangerine brand button, square corners) instead of the unbranded placeholder markup.
