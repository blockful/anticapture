---
name: anticapture-api
description: Use for apps/api work: adding or changing REST controllers, services, repositories, mappers, clients, schema mapping, or API tests.
---

# API Package Guide

## Use This Skill When

- You are editing files under `apps/api`.
- You are adding/changing a REST endpoint.
- You are changing API-layer business logic, queries, DTO mapping, or integrations.
- You are updating tests for API behavior.

## Package Snapshot

- Location: `apps/api`
- Runtime: Hono + `@hono/zod-openapi`
- Data access: Drizzle ORM (`src/repositories/drizzle`)
- Docs endpoint: `/docs`

## Architecture

- **Controllers**: Define routes, validate requests, handle responses
- **Services**: Implement business logic, orchestrate repositories and clients
- **Repositories**: Execute database queries using Drizzle ORM
- **Clients**: Interact with external APIs (CoinGecko, Dune, etc.)
- **Mappers**: Transform database models to API response DTOs

## Placement Rules

| What you're adding       | Where it goes                | Further information               |
| ------------------------ | ---------------------------- | --------------------------------- |
| API endpoints            | `src/controllers/<domain>/`  | `./references/new-endpoint.md`    |
| Business logic           | `src/services/<domain>/`     |                                   |
| Database query           | `src/repositories/<domain>/` |                                   |
| Data transformation      | `src/mappers/<domain>/`      |                                   |
| External API integration | `src/clients/<service>/`     |                                   |
| Database schema          | `src/database/schema/`       | `./references/database-schema.md` |

## Workflow

1. If changing routes/contracts, read `./references/new-endpoint.md`.
2. Implement controller + mapper + service + repository changes in the proper layer.
3. If schema-related, follow `./references/database-schema.md` exactly.
4. Add/update tests per `./references/testing-endpoint.md`.
5. Run verification:
   - `pnpm run --filter=@anticapture/api typecheck`
   - `pnpm run --filter=@anticapture/api test`

## Guardrails

- Keep transport validation in controllers/mappers, not in repositories.
- Keep database-specific logic in repositories.
- Do not couple controllers directly to database access.
