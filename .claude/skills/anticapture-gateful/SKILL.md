---
name: anticapture-gateful
description: Use for apps/gateful work: REST aggregation of DAO APIs, Hono + zod-openapi routing, DAO source discovery (DAO_API_*), proxying, caching, circuit breaker, and gateway tests.
---

# Gateful Package Guide

Gateful is the REST gateway that aggregates the per-DAO Anticapture APIs behind
a single OpenAPI surface. The dashboard and the `@anticapture/client` SDK consume
Gateful's REST/OpenAPI.

## Use This Skill When

- You are editing files in `apps/gateful`.
- You changed API endpoints and need to expose/route them through the gateway.
- DAO source/relayer mapping (`DAO_API_*`, `DAO_RELAYER_*`) needs updates.
- You are touching caching, the circuit breaker, proxying, or the OpenAPI spec.
- Gateful tests/typechecks fail or routing behavior changes.

## Package Snapshot

- Location: `apps/gateful` (`@anticapture/gateful`)
- Runtime: Hono + `@hono/zod-openapi` (OpenAPIHono) on Node, TypeScript
- Default port: `4001`
- OpenAPI spec: served **live** by the running gateway (merged from upstream API specs
  in `src/upstream-docs.ts`); `@anticapture/client` codegen consumes the live spec URL —
  there is no committed spec file
- Optional Redis cache (`REDIS_URL`); Prometheus metrics via `@anticapture/observability`

## How It Works

1. **Config load** (`src/config.ts`): `loadDaoMap("DAO_API_")` scans env vars and
   builds a `daoName -> URL` map (and `DAO_RELAYER_` for relayer endpoints), validated as URLs.
2. **App assembly** (`src/index.ts`): an `OpenAPIHono` app mounts middlewares
   (CORS, request logger, metrics, cache), resolvers, proxy routes, and health checks.
3. **Resolvers** (`src/resolvers/*`): typed routes that aggregate/transform upstream
   data (e.g. `daos`, `delegation`, `address-enrichment`).
4. **Proxy** (`src/proxy/*`): forwards DAO-scoped requests to the matching upstream
   API (and relayer), guarded by a circuit breaker (`src/shared/circuit-breaker*`).
5. **Caching** (`src/middlewares/cache.ts` + `src/cache/redis.ts`): caches responses
   with bounded Prometheus route labels.
6. **Spec publish** (`src/upstream-docs.ts`): merges upstream OpenAPI and serves Swagger UI.

## Workflow

1. If a new/changed API endpoint must be exposed, add or update the resolver/proxy route.
2. If DAO discovery changed, update how `DAO_API_*` / `DAO_RELAYER_*` are read in `src/config.ts`.
3. Keep route logic consistent with the upstream API contracts.
4. **If the OpenAPI surface changes, regenerate the SDK** so the dashboard stays in
   sync: `pnpm client codegen` (runs against a live Gateful — `scripts/wait-for-gateful.mjs`
   waits for it). Commit the regenerated files under `packages/anticapture-client/generated/`.
5. Verify:
   - `pnpm gateful typecheck`
   - `pnpm gateful lint`
   - `pnpm gateful test`

## Changeset Note

Any change that alters the API contract exposed through the gateway must ship with a
`@anticapture/gateful` changeset alongside the changed API package's — see the
`changesets` skill.

## Guardrails

- Every new or changed API endpoint exposed to the dashboard should be reflected
  in Gateful's routes **and** the regenerated `@anticapture/client` SDK.
- Keep DAO-specific routing explicit and fail fast on missing `DAO_API_*` config.
- Do not hand-edit files under `packages/anticapture-client/generated/` to paper over
  a route change — fix the route and regenerate.
