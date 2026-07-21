# @anticapture/authful

## 0.4.0

### Minor Changes

- [#2044](https://github.com/blockful/anticapture/pull/2044) [`b1c8e28`](https://github.com/blockful/anticapture/commit/b1c8e28f961ecf64d267194b6759f2121d466658) Thanks [@brunod-e](https://github.com/brunod-e)! - Add self-service API keys (DEV-950). Authful gains an optional scoped provisioning key that may only mint/revoke `user:*` tenants and cannot list all tenants (the admin key stays unrestricted). The User API brokers end-user keys through it: `POST/GET/DELETE /me/api-keys` (session-authenticated) mint into Authful under tenant `user:<userId>`, return the plaintext exactly once, and store only ownership (never the secret) — with a per-user quota and Authful-first revocation. Both surfaces stay disabled until their env is configured.

### Patch Changes

- [#2044](https://github.com/blockful/anticapture/pull/2044) [`d39173e`](https://github.com/blockful/anticapture/commit/d39173e50f94415d7f763bddd033444a0b7b5528) Thanks [@brunod-e](https://github.com/brunod-e)! - Self-service (`user:*`) API keys: the internal token validation metric buckets the per-user tenant label as `user:*` so the Prometheus series set stays bounded, matching Gateful's usage metric.

## 0.3.2

### Patch Changes

- [#2052](https://github.com/blockful/anticapture/pull/2052) [`74be484`](https://github.com/blockful/anticapture/commit/74be48478c2c39c684e9f088cd393b7c7736dadb) Thanks [@pikonha](https://github.com/pikonha)! - seed token as optional

## 0.3.1

### Patch Changes

- [#2053](https://github.com/blockful/anticapture/pull/2053) [`633b628`](https://github.com/blockful/anticapture/commit/633b6287869693b8c707677d7b0af62a4b2c6ad7) Thanks [@pikonha](https://github.com/pikonha)! - add pg pool config to avoid hanging db connections

## 0.3.0

### Minor Changes

- [#2032](https://github.com/blockful/anticapture/pull/2032) [`f1fc962`](https://github.com/blockful/anticapture/commit/f1fc9620f8d64822d8d357607b68fd3ee183b40c) Thanks [@pikonha](https://github.com/pikonha)! - Expose token names in Authful validation responses so Gateful usage metrics can count requests by tenant, token name, and route. Add Authful validation counters and Gateful circuit-breaker state metrics for monitoring dashboards.

- [#2022](https://github.com/blockful/anticapture/pull/2022) [`df56c8d`](https://github.com/blockful/anticapture/commit/df56c8db37a08a3669449fc10ac65a465fb2298a) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - Support unbounded (rate-limit-exempt) tokens. A token with `rateLimitPerMin` set to `0` (the sentinel for any non-positive value) is now skipped entirely by Gateful's rate-limit middleware — it never touches Redis and is never throttled. Authful's mint endpoint accepts `0` accordingly (`rateLimitPerMin` validation relaxed from positive to non-negative).

## 0.2.0

### Minor Changes

- [#2000](https://github.com/blockful/anticapture/pull/2000) [`1e6c3fb`](https://github.com/blockful/anticapture/commit/1e6c3fb2d6a7846a5d2e9f8aa4bcb769e0beab07) Thanks [@PedroBinotto](https://github.com/PedroBinotto)! - On Railway PR previews (`RAILWAY_ENVIRONMENT_NAME` other than `dev`/`production`) the service now seeds a fixed token from the required `SEED_TOKEN_PLAINTEXT` env var on boot — idempotently, so it survives restarts — giving the rest of the preview stack a known key to authenticate with. The seeding capability is internal only; the admin API still mints exclusively with server-generated values.

- [#1971](https://github.com/blockful/anticapture/pull/1971) [`4a85cf4`](https://github.com/blockful/anticapture/commit/4a85cf47d6a56b3f0c9de5da87978e0687755c55) Thanks [@brunod-e](https://github.com/brunod-e)! - Per-tenant API tokens (DEV-758): new Authful service issues, validates and revokes tenant tokens (sha256-only storage, manual minting); Gateful gains an optional token-auth middleware with Redis-cached validation, per-token rate limiting and per-tenant request metrics exposed on its `/metrics` endpoint (Prometheus counter `tenant_requests_total{tenant, route}`), enabled via `TOKEN_SERVICE_URL` (legacy `BLOCKFUL_API_TOKEN` behavior unchanged when unset). The MCP server can forward the caller's `Authorization` header to Gateful via `FORWARD_CLIENT_AUTH=true`; in that mode the shared `ANTICAPTURE_API_KEY` is never attached, so unauthenticated requests get a per-tenant 401 instead of riding the shared key.

### Patch Changes

- [#1971](https://github.com/blockful/anticapture/pull/1971) [`dd8756c`](https://github.com/blockful/anticapture/commit/dd8756c61fcb2a755a692a018a83ab36a61415c8) Thanks [@brunod-e](https://github.com/brunod-e)! - Add project-standard observability to Authful: structured Pino request logging, OpenTelemetry metrics/tracing via `@anticapture/observability`, an HTTP request-duration histogram, and a public `/metrics` Prometheus endpoint. Instrumentation is emitted as its own bundle entry and loaded with `node --import` so it registers before `pg`/`http` are required.

- [#1971](https://github.com/blockful/anticapture/pull/1971) [`858d286`](https://github.com/blockful/anticapture/commit/858d2860afbb58344044aa8c5d4629652ba47ae4) Thanks [@brunod-e](https://github.com/brunod-e)! - Mark request bodies as `required` on the Authful `POST /tokens` and `/validate` routes. Without it, `@hono/zod-openapi` skips validation and substitutes an empty body when a request omits the JSON content-type — letting `POST /tokens` mint a token with a null `tenant` (NOT NULL violation / 500) instead of returning a 400. Malformed and empty bodies are now rejected with 400.

- [#1971](https://github.com/blockful/anticapture/pull/1971) [`51e110a`](https://github.com/blockful/anticapture/commit/51e110a12820493c453097fc069b194f0b8c08e5) Thanks [@brunod-e](https://github.com/brunod-e)! - Standardize environment-variable handling to match the API module. The MCP server now loads `.env` via dotenv and validates `PORT`, `HOST`, `ANTICAPTURE_API_URL`, `ANTICAPTURE_API_KEY`, and `FORWARD_CLIENT_AUTH` through a single zod schema instead of ad-hoc `process.env` reads. Authful's env parsing switches to the same `safeParse` + friendly-error pattern and folds `TOKEN_PLAINTEXT` into the schema so the mint script no longer reads `process.env` directly. Gateful now normalizes `TOKEN_SERVICE_URL` (trailing-slash trimming) in its zod env schema rather than manually inside `AuthfulClient`.
