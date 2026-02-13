# AGENTS.md

> **Note**: Each package has its own detailed AGENTS.md file. See package-specific guides for detailed information:
>
> - [Indexer](apps/indexer/AGENTS.md) - Blockchain event indexing
> - [API](apps/api/AGENTS.md) - REST API with OpenAPI
> - [API Gateway](apps/api-gateway/AGENTS.md) - GraphQL gateway
> - [Dashboard](apps/dashboard/AGENTS.md) - Frontend application
> - [GraphQL Client](packages/graphql-client/AGENTS.md) - Type generation

- **Role**: Full-stack TypeScript engineer for the Anticapture DAO governance platform
- **Skills**: React, Next.js, Node.js, GraphQL, blockchain indexing, PostgreSQL
- **Output**: Production-ready code that passes typecheck and lint before commit

## Boundaries

### Always do

- Run `pnpm <package> typecheck` and `pnpm <package> lint` on affected packages after every change
- Use Conventional Commits for all commit messages
- Use the project's path aliases (`@/*`) for imports
- Follow the existing file/folder structure conventions in each package's AGENTS.md
- Use MCP tools (Railway, ClickUp) for read operations freely
- Check package-specific AGENTS.md for detailed guidelines

### Ask first

- Database schema changes or migrations
- Environment variable additions or modifications
- Railway deployments (even to `dev`)
- GraphQL schema changes that affect the generated client
- Deleting or renaming files that are imported across multiple packages
- Any write operations via MCP tools (Railway, ClickUp)

### Never do

- Modify `.env` files containing secrets
- Deploy to production
- Run the indexer without being explicitly asked (every code change triggers a full reindex)
- Force push to `main` or `dev`
- Remove or skip failing tests without explanation
- Commit `node_modules`, `.env`, or generated files
- Leak private variables
- Cast types to `any` or `unknown` without explicitly asked to

## Commands

```bash
# Development
pnpm dashboard dev                        # Next.js frontend on :3000
pnpm api dev                              # REST API on :42069
pnpm gateway dev                          # GraphQL gateway on :4000
pnpm client codegen                       # Generate TS types + hooks from gateway schema
pnpm client dev                           # Codegen with hot reload
pnpm indexer dev --config config/<dao>    # Blockchain indexer (triggers full reindex!)

# Verification (run after every change on affected packages)
pnpm <package> typecheck                  # tsc --noEmit
pnpm <package> lint                       # ESLint check
pnpm <package> lint:fix                   # Auto-fix lint issues

# Monorepo-wide
pnpm typecheck                            # turbo typecheck across all packages
pnpm lint                                 # turbo lint across all packages

# Testing
pnpm dashboard test                       # Jest unit tests for dashboard
pnpm api test                             # Jest unit tests for API
pnpm api test:watch                       # Jest watch mode for API
pnpm gateway test                         # Jest unit tests for gateway

# Infrastructure
pnpm indexer dev --config config/<dao>      # Only when explicitly asked
```

## External Tools

- **Railway**: Infrastructure is deployed on [Railway](https://railway.com/). Prioritize the `dev` environment for all backend services (indexer, api, gateway).
  - **Railway Skills**: 13 specialized agent skills installed from [railwayapp/railway-skills](https://github.com/railwayapp/railway-skills) for deployment operations. See [Railway agent guidelines](https://docs.railway.com/ai/agent-skills) for best practices.
  - Use `/deploy`, `/deployment`, `/status`, `/environment`, `/metrics`, `/service`, `/domain`, `/database`, `/projects`, `/new`, `/templates`, `/railway-docs`, or `/central-station` skills when working with Railway infrastructure.
- **ClickUp**: Issues and task tracking on [ClickUp](https://app.clickup.com/).
  - See `.agents/rules/clickup/clickup.mdc` for detailed configuration and best practices

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

| Component          | Port  | Purpose                                 | Docs                                                                   |
| ------------------ | ----- | --------------------------------------- | ---------------------------------------------------------------------- |
| **Indexer**        | 42069 | Blockchain event indexing (Ponder)      | [apps/indexer/AGENTS.md](apps/indexer/AGENTS.md)                       |
| **API**            | 42069 | REST API with OpenAPI (Hono + Drizzle)  | [apps/api/AGENTS.md](apps/api/AGENTS.md)                               |
| **API Gateway**    | 4000  | Unified GraphQL endpoint (GraphQL Mesh) | [apps/api-gateway/AGENTS.md](apps/api-gateway/AGENTS.md)               |
| **GraphQL Client** | —     | Generated TypeScript types & hooks      | [packages/graphql-client/AGENTS.md](packages/graphql-client/AGENTS.md) |
| **Dashboard**      | 3000  | Next.js frontend with DAO analytics     | [apps/dashboard/AGENTS.md](apps/dashboard/AGENTS.md)                   |

> **See each package's AGENTS.md for detailed information on stack, environment variables, file structure, and development workflows.**

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

### Rules (enforced via Prettier + ESLint)

- **Semicolons**: yes
- **Quotes**: double quotes
- **Trailing commas**: always
- **Print width**: 80
- **Tab width**: 2 spaces
- **TypeScript**: strict mode
- **Tailwind**: utility-first with `cn()` for class merging

### Naming Conventions

| Kind                | Convention       | Example                               |
| ------------------- | ---------------- | ------------------------------------- |
| Files and folders   | kebab-case       | `date-helpers.ts`                     |
| React components    | PascalCase       | `Button.tsx`, `DaoTemplate.tsx`       |
| Functions/variables | camelCase        | `getDaoParameters`, `isLoading`       |
| Types/Interfaces    | PascalCase       | `UseDaoDataResult`, `DaoIdEnum`       |
| Constants           | UPPER_SNAKE_CASE | `SECONDS_IN_DAY`, `CEXAddresses`      |
| Path aliases        | `@/*`            | `import { cn } from "@/shared/utils"` |

> **For code examples and implementation patterns, see each package's AGENTS.md file.**

## Git Workflow

### Branch naming

```text
<type>/<description-in-kebab-case>
```

Types: `feat/`, `fix/`, `chore/`, `refactor/`, `hotfix/`, `docs/`, `test/`

### Commit messages (Conventional Commits, enforced via commitlint + husky)

```text
<type>(<optional scope>): <description>
```

### Main branches

- `main` — production
- `dev` — development

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

If either command fails, fix the reported issues before committing.

## Pull Request Guidelines

When creating a PR, ensure it:

1. **Targets `dev` branch** by default (never directly to `main`)
2. **Includes clear description** of what changed and why
3. **References ClickUp issues** that it addresses
4. **Passes all checks**: `pnpm typecheck && pnpm lint` on affected packages
5. **Includes screenshots** for UI/visual changes
6. **Focused scope**: One concern per PR (avoid mixing features/fixes)
7. **Follows package guidelines**: Check relevant package AGENTS.md files

## Working with Package-Specific Guidelines

Each package has its own `AGENTS.md` file with detailed information:

- **Architecture & patterns** specific to that package
- **File structure conventions** and where to put new code
- **Code examples** and best practices
- **Testing strategies** and common issues
- **Package-specific commands** and workflows

**When working on a package, always check its AGENTS.md file first.**

## Self-Improvement

When making significant changes:

1. **Update root AGENTS.md** if you change:
   - Overall architecture (add/remove services)
   - Dependency graph or startup order
   - Cross-package conventions
   - General workflows or boundaries

2. **Update package AGENTS.md** if you change:
   - Package-specific architecture or patterns
   - File structure within that package
   - Package commands or development workflow
   - Testing strategies or code examples

3. **Avoid duplication**: If it's package-specific, put it in the package AGENTS.md, not root
