# AGENTS.md

Instructions for AI agents working in the Anticapture monorepo. This is the
**single source of truth** (`CLAUDE.md` just imports it). Read this first, then
consult the per-package skills in `.claude/skills/` (mirrored at
`.agents/skills/`) for the package you're editing.

## What this is

Anticapture is a pnpm + Turborepo monorepo for DAO governance analytics. Blockchain
data is indexed, served as a REST API, aggregated by a REST gateway, consumed through
a generated TypeScript SDK, and rendered in a Next.js dashboard.

## Architecture & data flow

```
PostgreSQL ──┐
             ├─> Indexer (Ponder: writes blockchain data to specific schema on DB,
                      │           creates a view called `anticapture` when finishes indexing)
Ethereum RPC ┘        │
                      v
             API (Hono + Drizzle: reads the `anticapture` view schema on DB, serves REST per DAO)
                      │
                      v
             Gateful (aggregates per-DAO APIs into one REST/OpenAPI surface, :4001)
                      │
                      v
             @anticapture/client (Kubb: generates TS types + React Query hooks
                      │            from Gateful's OpenAPI spec)
                      v
             Dashboard (Next.js frontend, :3000)
```

> The platform is **REST/OpenAPI end-to-end**.
> Data is DAO-scoped via a **path parameter** (e.g. `/{dao}/proposals`), not a header.

## Monorepo layout

### Apps (`apps/`)

| Package                           | Purpose                                       | Port  |
| --------------------------------- | --------------------------------------------- | ----- |
| `@anticapture/indexer`            | Ponder blockchain event indexing              | 42070 |
| `@anticapture/offchain-indexer`   | Off-chain (e.g. Snapshot) governance indexing | —     |
| `@anticapture/api`                | REST API with OpenAPI (Hono + Drizzle)        | 42069 |
| `@anticapture/gateful`            | REST/OpenAPI gateway aggregating DAO APIs     | 4001  |
| `@anticapture/dashboard`          | Next.js 16 frontend (React 19, Tailwind 4)    | 3000  |
| `@anticapture/address-enrichment` | Address metadata service (optional)           | 3001  |
| `@anticapture/relayer`            | Transaction relayer                           | —     |

### Packages (`packages/`)

| Package                      | Purpose                                                                  |
| ---------------------------- | ------------------------------------------------------------------------ |
| `@anticapture/client`        | Kubb-generated REST SDK (types + React Query hooks) from Gateful OpenAPI |
| `@anticapture/observability` | Shared logging/metrics (OpenTelemetry, Prometheus)                       |
| `@anticapture/local-node`    | Local node tooling                                                       |

## Commands

Run from the repo root. `pnpm <service> <cmd>` filters Turbo to one workspace.

```bash
# Per-service (e.g. pnpm dashboard dev, pnpm gateful dev, pnpm api dev <dao>)
pnpm dashboard <cmd>     # --filter=@anticapture/dashboard
pnpm gateful <cmd>       # --filter=@anticapture/gateful
pnpm api <cmd>           # --filter=@anticapture/api
pnpm client <cmd>        # --filter=@anticapture/client  (codegen | dev | build)
pnpm indexer <cmd>       # --filter=@anticapture/indexer

# Full local stack (orchestrated by scripts/dev.sh)
pnpm dev                 # remote dev APIs
pnpm dev <dao_id>        # also boot a local API for that DAO (e.g. pnpm dev ens)

# Regenerate the client SDK after the Gateful OpenAPI spec changes
pnpm client codegen

# Repo-wide checks
pnpm typecheck
pnpm lint
pnpm lint:fix
pnpm test
```

### Local startup order

`API → Gateful (:4001) → Client codegen → Dashboard (:3000)`.
Gateful discovers DAO APIs from `DAO_API_<DAO>` env vars; the dashboard reads the
gateway via `ANTICAPTURE_API_URL` (set to `http://localhost:4001` by `pnpm dev`).
See the `local-dev-stack` skill for details.

## Conventions

- **Data fetching (dashboard):** Anticapture data uses `@anticapture/client/hooks`
  (React Query). Pass `daoId.toLowerCase()` cast to the generated `XxxPathParamsDaoEnumKey`
  type as the first (path) argument. Vanilla fetch functions are exported from
  `@anticapture/client` (use in Server Components, sitemap, SEO).
- **Generated code:** never hand-edit files under `packages/anticapture-client/generated/`;
  regenerate with `pnpm client codegen` and commit the result. Use generated types over `any`.
- **Dashboard structure:** Server Components by default; `"use client"` only at interaction
  boundaries. Features are self-contained, no cross-feature imports; shared code lives in `shared/`.
- **Style:** enforced by Prettier + ESLint. Arrow functions; named exports (App Router
  pages are the `export default` exception); inline `type` imports.
- **Commits:** conventional commits (`feat:`, `fix(api):`, `chore:`, ...) — enforced by
  commitlint via husky's `commit-msg` hook; non-conforming messages are rejected at
  commit time. Pushing is fine; force-pushing is never allowed (blocked by permissions).

## Verification (required before claiming done)

Run typecheck and lint on every affected package; fix all errors before committing.

```bash
pnpm <service> typecheck && pnpm <service> lint   # scoped (preferred)
pnpm typecheck && pnpm lint                        # when changes span packages
```

## Changesets

Every PR to `dev` needs a changeset (`pnpm changeset`) or an empty one
(`pnpm changeset --empty`); the `changeset-check` CI job in `tests.yaml` enforces it.
When a change alters the API contract exposed through Gateful (and therefore the
regenerated `@anticapture/client` SDK), also add a `@anticapture/gateful` changeset
alongside the changed API package's. Never hand-edit `version` fields or `CHANGELOG.md`
— Changesets owns them. Full guidance (bump types, empty changesets, release flow) is
in the `changesets` skill.

## Boundaries — never do

- Modify `.env` files containing secrets.
- Force push.
- Remove or skip failing tests without explanation.
- Commit `node_modules`, `.env`, or generated files that aren't meant to be committed.
- Cast types to `any`/`unknown` unless explicitly asked.

## Where to go deeper

- `.claude/skills/<name>/` — package and workflow guides: `anticapture-api`,
  `anticapture-gateful`, `anticapture-dashboard`, `anticapture-indexer`,
  `anticapture-design-system`, `local-dev-stack`, `dao-integration`, `dashboard-dao`,
  `testing`, `changesets`, `tenderly-alerts`.

## Agent skills

### Issue tracker

Issues live in ClickUp (Tech space, shared Backlog + current sprint), read/written via the `mcp__clickup__*` tools. See `docs/agents/issue-tracker.md`. All of them have the project relationship set to Anticapture (86ahtje7p).

### Triage labels

Default five canonical roles, applied as ClickUp tags. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.
