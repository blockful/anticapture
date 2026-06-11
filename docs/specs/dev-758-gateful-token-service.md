# DEV-758 — Gateful tokens on demand (v1)

> Status: draft for review · Ticket: [DEV-758](https://app.clickup.com/t/86ahw07xd) · Branch: `feat/gateful-api-tokens`

## Problem

Access to the Anticapture API/MCP is protected by **two static shared secrets**, both hardcoded in env vars:

1. `ANTICAPTURE_MCP_API_KEY` — single bearer key validated by the MCP server (`packages/anticapture-client/mcp-server-http.ts`). Every external consumer (including Uniswap) uses **the same key**. No visibility of who is calling, how, or how much.
2. `BLOCKFUL_API_TOKEN` — single bearer key validated by Gateful (`apps/gateful/src/index.ts`). The MCP server swaps the client's identity for this key (`ANTICAPTURE_API_KEY`) when calling upstream, so tenant identity never reaches Gateful.

We need per-tenant tokens issued on demand, so each consumer (us, Uniswap, future third parties) has its own credential that carries **rate limiting**, **usage tracking**, and (future) **billing**.

## Goals (v1)

- Per-tenant tokens; issuance is **manual** (we mint and hand over).
- Gateful is the **single auth guardian** — same validation path for MCP traffic and direct REST.
- Per-token rate limiting and usage tracking, attributable by tenant.
- **Zero-downtime migration**: Uniswap's current key cannot be revoked or rotated — it must keep working unchanged.

### Non-goals (v1)

- Self-serve token creation / user accounts / dashboard UI.
- Billing (schema should not preclude it; nothing more).
- Scopes/permissions per token (all tokens grant full read access).

## Architecture

```
Client (Uniswap, Blockful, third parties)
   │  Authorization: Bearer <tenant token>
   ├────────────────► mcp.anticapture.com/mcp ──► MCP server
   │                    (no longer validates; forwards client Bearer per-request)
   │                                   │  Bearer <tenant token>
   ▼                                   ▼
                 Gateful ◄─────────────┘
   ├─ auth middleware: Redis cache → Token Service on miss (fail-closed)
   ├─ rate limit per token (Redis sliding window)
   ├─ usage tracking per token/route (batched, best-effort)
   ▼
 DAO APIs

 Token Service (new Railway service) + dedicated Postgres
```

## Components

### 1. Token Service (new app, `apps/authful`)

Small Hono + Drizzle service with its own Postgres on Railway. Plaintext tokens are **never stored** — only `sha256(token)`.

Endpoints (admin endpoints guarded by a static `ADMIN_API_KEY` in v1):

| Method | Path           | Auth               | Purpose                                                 |
| ------ | -------------- | ------------------ | ------------------------------------------------------- |
| POST   | `/tokens`      | admin              | Mint token for `{tenant, name}`; returns plaintext once |
| DELETE | `/tokens/:id`  | admin              | Revoke (sets `revoked_at`)                              |
| GET    | `/tokens`      | admin              | List metadata (no hashes)                               |
| POST   | `/validate`    | internal (Gateful) | `{tokenHash}` → `{valid, tenant, rateLimitPerMin}`      |
| POST   | `/usage/batch` | internal (Gateful) | Idempotent upsert of usage counters                     |

Schema:

```sql
tokens (
  id uuid PK,
  tenant text NOT NULL,            -- "uniswap", "blockful", ...
  name text NOT NULL,              -- human label, e.g. "uniswap mcp prod"
  token_hash text UNIQUE NOT NULL, -- sha256 hex
  rate_limit_per_min int NOT NULL DEFAULT 600,
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  last_used_at timestamptz
)

usage_hourly (
  token_id uuid REFERENCES tokens,
  route text NOT NULL,             -- normalized route pattern, e.g. /{dao}/proposals
  hour timestamptz NOT NULL,       -- truncated to hour
  count bigint NOT NULL DEFAULT 0,
  PRIMARY KEY (token_id, route, hour)
)
```

### 2. Gateful auth middleware (replaces the static `bearerAuth`)

Request flow:

1. Extract Bearer; missing → `401`. Public paths unchanged: `/docs`, `/docs/json`, `/health`, `/metrics`.
2. `GET redis token:<sha256>` → **hit**: attach `{tenant, tokenId, rateLimitPerMin}` to context.
3. **Miss**: `POST /validate` on Token Service → cache result in Redis (TTL **300s**, including negative results with a short TTL, e.g. 60s).
4. Unknown/revoked → `401` (**fail-closed**). Token Service unreachable **and** cache miss → `503` (cached tokens keep working through an outage — Uniswap must never take a 401 because our internal service restarted).
5. Rate limit: Redis `INCR` on `rl:<tokenId>:<minute>` → over limit → `429` with `Retry-After`.
6. After response: increment usage buffer (`tokenId`, route pattern, hour). A background interval flushes batches to `POST /usage/batch` every ~30s. **Best-effort** — tracking failures never block or fail a request.

Tenant becomes a low-cardinality label on existing Gateful metrics/logs (few tenants, safe for Prometheus).

### 3. MCP server changes (`packages/anticapture-client`)

- Remove `ANTICAPTURE_MCP_API_KEY` validation entirely (keep `/health` open).
- Forward the inbound `Authorization` header **per request** to Gateful. The kubb axios client is configured globally at boot (`configure-upstream-client.ts`), so this requires an `AsyncLocalStorage` context: wrap each `transport.handleRequest(req, res)` call with the request's bearer in ALS; an axios request interceptor reads ALS and sets the header. ✅ **Risk retired**: validated by a throwaway concurrency spike — 10 interleaved calls from two concurrent tenant sessions each carried their own bearer, no cross-contamination (spike removed after validation). Forwarding is gated by `FORWARD_CLIENT_AUTH=true` so it only activates once Gateful validates per-tenant tokens (rollout step 3).
- Drop the `ANTICAPTURE_API_KEY` env from the MCP service once migrated (no silent fallback identity).

### 4. Migration / rollout (no client action required)

1. Deploy Token Service + Postgres. Seed: Uniswap's current `ANTICAPTURE_MCP_API_KEY` value as tenant `uniswap`; current `BLOCKFUL_API_TOKEN` as tenant `blockful` (used by dashboard/SDK/internal).
2. Deploy Gateful with the new middleware behind config: if `TOKEN_SERVICE_URL` is set → new path; else → legacy `BLOCKFUL_API_TOKEN` behavior. Flip in dev first.
3. Deploy MCP forward change. Uniswap's key now flows MCP → Gateful and validates against the store — same key, zero action on their side.
4. Remove `ANTICAPTURE_MCP_API_KEY` from the MCP service and (after a soak period) the legacy branch + `BLOCKFUL_API_TOKEN` from Gateful.

Rollback at any stage = unset the new env vars; legacy keys still work until step 4.

## Resilience decisions

| Scenario                                  | Behavior                                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------------- |
| Unknown/revoked token                     | `401` fail-closed                                                                        |
| Token Service down, token cached in Redis | Request proceeds (cache TTL 300s)                                                        |
| Token Service down, cache miss            | `503` (distinguishable from bad credentials)                                             |
| Redis down                                | Validate directly against Token Service; rate limit fails open; usage buffered in memory |
| Usage flush failure                       | Log + retry next interval; never blocks requests                                         |

## Implementation stages

1. ✅ **Token Service** (`apps/authful`): app scaffold, schema/migrations, endpoints, mint/seed script, 13 integration tests (PGlite).
2. ✅ **Gateful middleware** (`apps/gateful/src/auth/`): validation + Redis cache + rate limit + usage flush, behind `TOKEN_SERVICE_URL` flag, 18 tests covering the resilience table.
3. ✅ **MCP forward**: ALS-based per-request header propagation, gated by `FORWARD_CLIENT_AUTH`; spike validated concurrency isolation.
4. **Rollout**: ✅ Railway infra (`infra/authful/`); remaining (operational): provision Postgres + service, seed prod tokens (`uniswap`, `blockful`), flip envs dev → prod, remove legacy keys after soak.

## Open questions

- Default rate limit value per token (proposal: 600 req/min; Uniswap may need a higher explicit limit).
- Should `/validate` be replaced by Gateful reading the token DB directly? (fewer hops, but couples Gateful to the schema — current proposal keeps the service as the only DB owner).
- Route normalization source for `usage_hourly.route` (matched Hono route pattern vs raw path).
