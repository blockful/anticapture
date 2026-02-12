# AGENTS.md

- **Role**: Full-stack TypeScript engineer for the Anticapture DAO governance platform
- **Skills**: React, Next.js, Node.js, GraphQL, blockchain indexing, PostgreSQL
- **Output**: Production-ready code that passes typecheck and lint before commit

## Boundaries

### Always do

- Run `pnpm <package> typecheck` and `pnpm <package> lint` on affected packages after every change
- Use Conventional Commits for all commit messages
- Use the project's path aliases (`@/*`) for imports
- Follow the existing file/folder structure conventions described below
- Use MCP tools (Railway, ClickUp) for read operations freely

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

## Components

### Overview

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

### 1. Indexer (`@anticapture/indexer`)

- `service-id`: `<dao>-indexer`
- **Port**: 42069
- **Source**: `apps/indexer`
- **Stack**: Ponder 0.16, Hono 4.10, viem 2.37, Zod 3.25
- **Depends on**: PostgreSQL and Ethereum RPC
- **Dev command**: `pnpm indexer dev --config config/<dao>.config`
- **Caveats**:
  - Every code change triggers a full reindex of the DAO contracts.
  - Only run it when explicitly asked and avoid unnecessary changes.

### 2. API (`@anticapture/api`)

- `service-id`: `<dao>-api`
- **Port**: 42069 (configurable via `PORT`)
- **Source**: `apps/api`
- **Stack**: Hono 4.7, Drizzle ORM 0.41, @hono/zod-openapi 0.19, pg 8.17
- **What it does**: REST API serving governance data from the indexer. Exposes an OpenAPI spec at `/docs` consumed by the API Gateway.
- **Depends on**: PostgreSQL (with data from Indexer), Ethereum RPC
- **Dev command**: `pnpm api dev`
- **Test command**: `pnpm api test`
- **Database schema**: ALl the schema is a mapping from the @apps/indexer/ponder.schema.ts syntax to the Drizzle version of it. Whenever something is needed, it should be changed on the original file first, and then translated to the drizzle format.

### 3. API Gateway (`@anticapture/api-gateway`)

- `service-id`: `api-gateway`
- **Port**: 4000
- **Source**: `apps/api-gateway`
- **Stack**: GraphQL Mesh 0.100+, GraphQL 16.11
- **What it does**: Aggregates multiple DAO API instances into a single unified GraphQL endpoint. Discovers sources dynamically from `DAO_API_*` env vars, connecting to each API's `/docs` OpenAPI spec.
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
- **Stack**: @graphql-codegen/cli 5.0, @graphql-codegen/typescript-react-apollo 4.3
- **What it does**: Reads the API Gateway's GraphQL schema and generates TypeScript types + React Apollo hooks. The dashboard imports this as a `workspace:*` dependency.
- **Depends on**: API Gateway either locally or on Railway
- **Codegen command**: `pnpm client codegen`
- **Dev command (hot reload)**: `pnpm client dev`
- **Env vars**: use the remote gateway to generate things locally

| Variable                       | Required | Default | Description     |
| ------------------------------ | -------- | ------- | --------------- |
| `ANTICAPTURE_GRAPHQL_ENDPOINT` | yes      | —       | API Gateway URL |

### 5. Dashboard (`@anticapture/dashboard`)

- **Port**: 3000
- **Source**: `apps/dashboard`
- **Stack**: Next.js 16.1, React 19.2, Tailwind CSS 4.1, Apollo Client 3.13, wagmi 2.12, viem 2.37, Zustand 5.0, Recharts 2.15
- **What it does**: Frontend application providing DAO governance analytics, risk assessment, token distribution, and community tools.
- **Depends on**: API Gateway (at runtime via GraphQL), GraphQL Client (at build time via workspace dep)
- **Dev command**: `pnpm dashboard dev`
- **Test command**: `pnpm dashboard test`
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

1. `pnpm api dev`
2. `pnpm gateway dev`
3. `pnpm client codegen`
4. `pnpm dashboard dev`

Common flows:

- **UI implementation**: run the client and dashboard pointing to the dev `api-gateway`
- **API feature**: run the API with the dev envs, then gateway and then client + dashboard (only run the gateway and frontend when asked)

## File Structure Conventions

### Where to put new code

| What you're adding             | Where it goes                                     |
| ------------------------------ | ------------------------------------------------- |
| New dashboard feature          | `apps/dashboard/features/<feature-name>/`         |
| Feature-specific component     | `apps/dashboard/features/<feature>/components/`   |
| Feature-specific hook          | `apps/dashboard/features/<feature>/hooks/`        |
| Reusable UI component          | `apps/dashboard/shared/components/ui/`            |
| Design system component        | `apps/dashboard/shared/components/design-system/` |
| Shared hook (cross-feature)    | `apps/dashboard/shared/hooks/`                    |
| Shared utility function        | `apps/dashboard/shared/utils/`                    |
| Shared TypeScript types        | `apps/dashboard/shared/types/`                    |
| Page-level template            | `apps/dashboard/templates/`                       |
| Next.js route                  | `apps/dashboard/app/`                             |
| New API controller             | `apps/api/src/controllers/<domain>/`              |
| API service (business logic)   | `apps/api/src/services/<domain>/`                 |
| API repository (data access)   | `apps/api/src/repositories/<domain>/`             |
| API data mapper                | `apps/api/src/mappers/<domain>/`                  |
| External API client            | `apps/api/src/clients/<service>/`                 |
| Database schema                | `apps/api/src/database/schema/`                   |
| Indexer event handler          | `apps/indexer/src/eventHandlers/`                 |
| Per-DAO indexer implementation | `apps/indexer/src/indexer/<dao>/`                 |
| DAO-specific indexer config    | `apps/indexer/config/<dao>.config.ts`             |

### Feature module structure (Dashboard)

Each feature follows this pattern:

```
features/<feature-name>/
├── components/     # Feature-specific components
├── hooks/          # Feature-specific hooks
├── contexts/       # Feature-specific React contexts
└── utils/          # Feature-specific utilities
```

### API layered architecture

```
Controller (route + validation) → Service (business logic) → Repository (DB queries)
                                                            → Client (external APIs)
                                  Mapper (DB → API response)
```

## Testing

### Frameworks

| Package   | Framework               | Config file                       |
| --------- | ----------------------- | --------------------------------- |
| Dashboard | Jest 29 + ts-jest       | `apps/dashboard/jest.config.js`   |
| API       | Jest 29 + ts-jest       | `apps/api/jest.config.js`         |
| Gateway   | Jest 29 + ts-jest       | `apps/api-gateway/jest.config.js` |
| Dashboard | Storybook 10 + Vitest 3 | `apps/dashboard/vitest.config.ts` |

## Code Style

### Rules (enforced via Prettier + ESLint)

- **Semicolons**: yes
- **Quotes**: double quotes
- **Trailing commas**: always
- **Print width**: 80
- **Tab width**: 2 spaces
- **TypeScript**: strict mode
- **Tailwind**: utility-first with `cn()` for class merging

### Naming

| Kind                | Convention       | Example                               |
| ------------------- | ---------------- | ------------------------------------- |
| Files and folders   | kebab-case       | `date-helpers.ts`                     |
| React components    | PascalCase       | `Button.tsx`, `DaoTemplate.tsx`       |
| Functions/variables | camelCase        | `getDaoParameters`, `isLoading`       |
| Types/Interfaces    | PascalCase       | `UseDaoDataResult`, `DaoIdEnum`       |
| Constants           | UPPER_SNAKE_CASE | `SECONDS_IN_DAY`, `CEXAddresses`      |
| Path aliases        | `@/*`            | `import { cn } from "@/shared/utils"` |

### Example: React component

```tsx
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/shared/utils";
import Spinner from "@/shared/components/ui/spinner";

export const Button = ({
  children,
  className,
  disabled = false,
  variant = "primary",
  loading = false,
  loadingText,
  ...props
}: ButtonProps) => {
  const isDisabled = disabled || loading;

  return (
    <button
      className={cn(
        "flex items-center justify-center gap-1.5 text-sm font-medium",
        variantStyles[variant],
        isDisabled && "pointer-events-none opacity-50",
        className,
      )}
      disabled={isDisabled}
      {...props}
    >
      {loading ? <Spinner label={loadingText} /> : children}
    </button>
  );
};
```

### Example: API controller (Hono + OpenAPI)

```typescript
import { OpenAPIHono as Hono, createRoute } from "@hono/zod-openapi";
import { DaoService } from "@/services";
import { DaoResponseSchema } from "@/mappers";

export function dao(app: Hono, service: DaoService) {
  app.openapi(
    createRoute({
      method: "get",
      operationId: "dao",
      path: "/dao",
      summary: "Get DAO governance parameters",
      tags: ["governance"],
      responses: {
        200: {
          description: "DAO governance parameters",
          content: {
            "application/json": { schema: DaoResponseSchema },
          },
        },
      },
    }),
    async (context) => {
      const daoData = await service.getDaoParameters();
      return context.json(daoData, 200);
    },
  );
}
```

## Git Workflow

### Branch naming

```text
<type>/<description-in-kebab-case>
```

Types: `feat/`, `fix/`, `chore/`, `refactor/`, `hotfix/`, `docs/`, `test/`

Examples: `feat/activity-feed`, `fix/proposal-state`, `hotfix/voting-modal-crash`

### Commit messages (Conventional Commits, enforced via commitlint + husky)

```text
<type>(<optional scope>): <description>
```

Types: `feat`, `fix`, `chore`, `refactor`, `docs`, `style`, `test`, `perf`, `ci`, `build`, `revert`

Examples:

- `feat: event feed dashboard`
- `fix: prevent BigInt crash from formatted voting power string`
- `chore(deps): update graphql-mesh to 0.100`

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

1. All PR should target the `dev` branch by default
2. Includes a clear description of the changes
3. References any related ClickUp issues it addresses
4. Passes all typecheck and lint checks
5. Includes screenshots for UI changes
6. Keeps the PR focused on a single concern

## Shared Agent Configuration

All agent configuration (MCP servers, skills, rules) lives in `.agents/` as the single source of truth, symlinked into each tool's config directory.

```text
.agents/
├── mcp.json              # MCP server definitions
├── skills/               # Agent skills (e.g. Railway)
└── rules/                # Service-specific .mdc rules
    └── <service>/

.claude/
├── mcp.json        → ../.agents/mcp.json
├── skills/<skill>  → ../../.agents/skills/<skill>
└── rules/<service> → ../../.agents/rules/<service>

.cursor/
├── mcp.json        → ../.agents/mcp.json
├── skills/<skill>  → ../../.agents/skills/<skill>
└── rules/<service> → ../../.agents/rules/<service>
```

Each packages hae their own AGENTS.md file, take them into consideration.

### Adding new configuration

When adding a new MCP server, skill, or rule:

1. Add the source file in `.agents/`
2. Symlink it into both `.claude/` and `.cursor/`:

```bash
# MCP config (already symlinked once)
ln -s ../.agents/mcp.json .claude/mcp.json
ln -s ../.agents/mcp.json .cursor/mcp.json

# New skill
ln -s ../../.agents/skills/<skill> .claude/skills/<skill>
ln -s ../../.agents/skills/<skill> .cursor/skills/<skill>

# New rule directory
ln -s ../../../.agents/rules/<service> .claude/rules/<service>
ln -s ../../../.agents/rules/<service> .cursor/rules/<service>
```

Never place tool-specific config directly in `.claude/` or `.cursor/` — always go through `.agents/`.

## Self-Improvement

When you make significant changes to the codebase:

1. **Update AGENTS.md** if you change:
   - Architecture (add/remove services, change dependency graph)
   - Commands or workflows
   - File structure conventions
   - Code style patterns or examples

2. **Do NOT duplicate** — if it's already in AGENTS.md, don't add it to rules
