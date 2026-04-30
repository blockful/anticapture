---
name: anticapture-gateway
description: Use for apps/api-gateway work: Mesh configuration, DAO source discovery, REST-to-GraphQL resolvers, schema aggregation, and gateway tests.
---

# API Gateway Package Guide

## Use This Skill When

- You are editing files in `apps/api-gateway`.
- You changed API endpoints and need to reflect them in gateway resolvers.
- DAO source/environment mapping (`DAO_API_*`) needs updates.
- Gateway tests/typechecks fail or schema behavior changes.

## Package Snapshot

- Location: `apps/api-gateway`
- Runtime: GraphQL Mesh + TypeScript
- Default port: `4000`

## How It Works

1. **Environment scanning**: Reads `DAO_API_*` variables
2. **Source registration**: Creates GraphQL Mesh sources for each API
3. **Schema stitching**: Combines all schemas into unified GraphQL schema
4. **Request routing**: Routes queries to backend API using `daoId` arg and/or `anticapture-dao-id` header
5. **Response aggregation**: Combines results from multiple APIs

## Workflow

1. If REST endpoint surface changed, update `src/resolvers/rest.ts`.
2. If DAO discovery behavior changed, update `meshrc.ts` (`DAO_API_*` scan path).
3. Keep resolver logic consistent with API docs/contracts.
4. Verify:
   - `pnpm run --filter=@anticapture/api-gateway typecheck`
   - `pnpm run --filter=@anticapture/api-gateway lint`
   - `pnpm run --filter=@anticapture/api-gateway test`

## Guardrails

- Every new or changed API endpoint exposed to dashboard should be reflected in gateway resolver mapping.
- Keep DAO-specific routing explicit and fail fast on missing `DAO_API_*` configuration.
