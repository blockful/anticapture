# Anticapture

## Boundaries

### Always do

- Run `pnpm <package> typecheck` and `pnpm <package> lint` on affected packages after every change

### Never do

- Modify `.env` files containing secrets
- Force push
- Remove or skip failing tests without explanation
- Commit `node_modules`, `.env`, or generated files
- Cast types to `any` or `unknown` without explicitly asked to

## Architecture Overview

Anticapture is a pnpm monorepo with 5 runtime components and 1 code-generation package:

```
PostgreSQL ───┐
              ├──> Indexer (writes blockchain data to DB)
Ethereum RPC ─┘         │
                        v
              ├──> API (reads DB, serves REST/OpenAPI)
              │         │
              │         v
              └──> API Gateway (aggregates DAO APIs into GraphQL)
                        │
                        ├──> GraphQL Client (generates TS types + hooks)
                        │         │
                        v         v
                      Dashboard (Next.js frontend)
```

### Components Summary

| Component          | Port  | Purpose                                 |
| ------------------ | ----- | --------------------------------------- |
| **Indexer**        | 42069 | Blockchain event indexing (Ponder)      |
| **API**            | 42069 | REST API with OpenAPI (Hono + Drizzle)  |
| **API Gateway**    | 4000  | Unified GraphQL endpoint (GraphQL Mesh) |
| **GraphQL Client** | —     | Generated TypeScript types & hooks      |
| **Dashboard**      | 3000  | Next.js frontend with DAO analytics     |

## Dependency Graph (startup order)

For a full local stack, start services in this order:

1. `pnpm api dev`
2. `pnpm gateway dev`
3. `pnpm client codegen`
4. `pnpm dashboard dev`

Common development workflows:

- **UI implementation**: Run client and dashboard pointing to dev `api-gateway`
- **API feature**: Run API with dev envs, then gateway, then client + dashboard (only run gateway and frontend when asked)
- **Full stack**: Start all services in order (rare, prefer using Railway dev services)

> **For detailed file structure conventions and testing strategies, see each package's AGENTS.md file.**

## Code Style

- Rules enforced via Prettier + ESLint

## Verification

After every implementation, run typecheck and lint on the affected packages before considering the task done. Fix all errors before committing.

```bash
# Prefer scoped checks when changes are limited to one package
pnpm <service> typecheck
pnpm <service> lint
pnpm <service> lint:fix

# Full monorepo (use when changes span multiple packages)
pnpm typecheck
pnpm lint
pnpm lint:fix
```
