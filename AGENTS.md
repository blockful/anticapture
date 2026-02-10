# AGENTS.md

## External tools

Use the respective MCPs whenever needed.
All read operations are allowed, write operations should be confirmed.

- Infra is deployed on [Railway](https://railway.com/)
  - All the command can be run using the configs from Railway (`railway run -s <service-id> -e dev <command>`)
  - Prioritize using it on the `dev` environment for all backend services (indexer, api and gateway)
- Issues are handled on [Clickup](https://app.clickup.com/)

## Components

### Overview

Anticapture is a pnpm monorepo with 5 runtime components and 1 code-generation package. The dependency chain for serving the dashboard is:

```
PostgreSQL ─┐
             ├─> Indexer (writes blockchain data to DB)
Ethereum RPC ┘         │
                       ▼
             ├─> API (reads DB, serves REST/OpenAPI)
             │         │
             │         ▼
             └─> API Gateway (aggregates DAO APIs into GraphQL)
                       │
                       ├─> GraphQL Client (generates TS types + hooks)
                       │         │
                       ▼         ▼
                     Dashboard (Next.js frontend)
```

### 1. Indexer (`@anticapture/indexer`)

- `service-id`: `<dao>-indexer`
- **Port**: 42069
- **Source**: `apps/indexer`
- **Framework**: [Ponder](https://ponder.sh)
- **Depends on**: PostgreSQL and Ethereum RPC
- **Dev command**: `pnpm indexer dev --config config/<dao>.config`
- **Caveats**:
  - Every code change triggers a full reindex of the DAO contracts.
  - Only run it when explicit asked to and avoid unnecessary changes.

### 2. API (`@anticapture/api`)

- `service-id`: `<dao>-api`
- **Port**: 42069 (configurable via `PORT`)
- **Source**: `apps/api`
- **Framework**: Hono + Drizzle ORM + Zod OpenAPI
- **What it does**: REST API serving governance data from the indexer. Exposes an OpenAPI spec at `/docs` consumed by the API Gateway
- **Depends on**: PostgreSQL (with data from Indexer), Ethereum RPC
- **Dev command**: `pnpm api dev`

### 3. API Gateway (`@anticapture/api-gateway`)

- `service-id`: `api-gateway`
- **Port**: 4000
- **Source**: `apps/api-gateway`
- **Framework**: GraphQL Mesh
- **What it does**: Aggregates multiple DAO API instances into a single unified GraphQL endpoint. Discovers sources dynamically from `DAO_API_*` env vars, connecting to each API's `/docs` OpenAPI spec
- **Depends on**: One or more API instances running either locally or on Railway
- **Dev command**: `pnpm gateway dev`
- **Env vars**:

| Variable        | Required     | Example                  | Description             |
| --------------- | ------------ | ------------------------ | ----------------------- |
| `DAO_API_ENS`   | at least one | `http://localhost:42069` | URL of ENS API instance |
| `DAO_API_UNI`   | no           | `http://localhost:42070` | URL of UNI API instance |
| `DAO_API_<DAO>` | no           | —                        | Any supported DAO ID    |
| `PORT`          | no           | 4000                     | HTTP port               |

### 4. GraphQL Client (`@anticapture/graphql-client`)

- **Source**: `packages/graphql-client`
- **What it does**: Reads the API Gateway's GraphQL schema and generates TypeScript types + React Apollo hooks. The dashboard imports this as a `workspace:*` dependency
- **Depends on**: API Gateway either locally or on Railway
- **Codegen command**: `pnpm client codegen`
- **Dev command (hot reload)**: `pnpm client dev`
- **Env vars**: use the remote gateway to generate things locally

| Variable                       | Required | Default | Description                                    |
| ------------------------------ | -------- | ------- | ---------------------------------------------- |
| `ANTICAPTURE_GRAPHQL_ENDPOINT` | yes      | —       | API Gateway URL (e.g. `http://localhost:4000`) |

### 5. Dashboard (`@anticapture/dashboard`)

- **Port**: 3000
- **Source**: `apps/dashboard`
- **Framework**: Next.js 15 (App Router), React 19, Tailwind CSS, Apollo Client
- **What it does**: Frontend application providing DAO governance analytics, risk assessment, token distribution, and community tools
- **Depends on**: API Gateway (at runtime via GraphQL), GraphQL Client (at build time via workspace dep)
- **Dev command**: `pnpm dashboard dev`
- **Env vars** (from `apps/dashboard/.env`):

| Variable                                | Required | Description                                                         |
| --------------------------------------- | -------- | ------------------------------------------------------------------- |
| `NEXT_PUBLIC_BASE_URL`                  | yes      | API Gateway GraphQL endpoint (e.g. `http://localhost:4000/graphql`) |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | yes      | WalletConnect project ID                                            |
| `NEXT_PUBLIC_ALCHEMY_KEY`               | yes      | Alchemy RPC key                                                     |
| `NEXT_PUBLIC_SITE_URL`                  | no       | Site URL for SEO/meta                                               |
| `RESEND_API_KEY`                        | no       | Resend email API key (contact form)                                 |
| `RESEND_FROM_EMAIL`                     | no       | Sender email address                                                |
| `CONTACT_EMAIL`                         | no       | Recipient for contact form                                          |

---

## Dependency Graph (startup order)

For a full local stack, start services in this order:

1. pnpm api dev
2. pnpm gateway dev
3. pnpm client codegen
4. pnpm dashboard dev

## Code style

- TypeScript strict mode
- Single quotes, no semicolons
- Functional patterns where possible
- Conventional Commits enforced via commitlint + husky
- ESLint + Prettier for formatting

## Verification

After every implementation, run typecheck and lint on the affected packages before considering the task done. Fix all errors before committing.

```bash
# Run across the entire monorepo
pnpm typecheck        # turbo typecheck — runs tsc --noEmit in all packages
pnpm lint             # turbo lint
pnpm lint:fix         # turbo lint:fix — auto-fix what's possible

# Run for a specific package (prefer this when changes are scoped)
pnpm dashboard typecheck
pnpm dashboard lint
pnpm indexer typecheck
pnpm indexer lint
pnpm api typecheck
pnpm gateway typecheck
```

If either command fails, fix the reported issues before committing.

## Pull Request Guidelines

When creating a PR, please ensure it:

1. Includes a clear description of the changes as guided
2. References any related issues that it is addressing
3. Ensures all tests passing
4. Includes screenshots for UI changes implemented
5. Keeps PRs focused on a single concern
