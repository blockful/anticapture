# AGENTS.md

Instructions for AI agents working in the Anticapture monorepo. Read this first,
then consult `CLAUDE.md` (deeper conventions) and the per-package skills in
`.claude/skills/` (mirrored at `.agents/skills/`) for the package you're editing.

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
| `@anticapture/indexer`            | Ponder blockchain event indexing              | 42069 |
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
gateway via `NEXT_PUBLIC_GATEFUL_URL` (set to `http://localhost:4001` by `pnpm dev`).
See the `local-dev` skill for details.

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

## Verification (required before claiming done)

Run typecheck and lint on every affected package; fix all errors before committing.

```bash
pnpm <service> typecheck && pnpm <service> lint   # scoped (preferred)
pnpm typecheck && pnpm lint                        # when changes span packages
```

## Changesets

Every PR to `dev` needs a changeset (`pnpm changeset`) or an empty one
(`pnpm changeset --empty`); the `changeset-check` CI job enforces it. When a change
touches an API OpenAPI contract (`apps/api/openapi/**` or `apps/gateful/openapi/gateful.json`),
also add a `@anticapture/gateful` changeset (enforced by `api-contract-updates.yaml`).
Never hand-edit `version` fields or `CHANGELOG.md` — Changesets owns them.

## Boundaries — never do

- Modify `.env` files containing secrets.
- Force push.
- Remove or skip failing tests without explanation.
- Commit `node_modules`, `.env`, or generated files that aren't meant to be committed.
- Cast types to `any`/`unknown` unless explicitly asked.

## Where to go deeper

- `CLAUDE.md` — full conventions, changeset/release flow, boundaries.
- `.claude/skills/<package>/` — package-specific guides (`anticapture-api`, `anticapture-gateful`,
  `anticapture-client`, `anticapture-dashboard`, `anticapture-indexer`, `local-dev`,
  `dao-integration`, `testing`, ...).

<claude-mem-context>
# Memory Context

# [jakarta] recent context, 2026-06-04 5:10pm GMT-3

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (16,852t read) | 426,231t work | 96% savings

### Jun 4, 2026

1030 3:01p ✅ Final kubb.config.ts migration fully verified: typecheck passes with GITHUB_EVENT_PATH fallback
1031 " 🔵 ESLint fails with ENOENT when generated directory is absent before codegen runs
1032 3:03p 🔵 kubb.config.ts OpenAPI URL Resolution Depends on Vercel Env Vars
1033 " 🔵 Railway Infra Config Exists Per-Service but No Dashboard/Client Railway Config
1034 " 🔵 Vercel Env Vars Embedded Throughout Build Pipeline Including turbo.json
1035 " 🔵 turbo.json Codegen Task Caches on Vercel Env Vars — Must Be Updated Alongside kubb.config.ts
1036 3:04p ⚖️ Railway URL Strategy: Use RAILWAY_ENVIRONMENT_NAME to Build Gateful Preview URL
1037 3:08p 🔵 Existing Changeset Already Covers the Vercel→Railway Codegen Migration
1038 " 🔵 kubb.config.ts and turbo.json Already Modified on Branch Relative to origin/dev
1039 3:09p 🟣 kubb.config.ts Decoupled from Vercel Env Vars — Now Uses RAILWAY_ENVIRONMENT_NAME
1040 " 🔴 All 5 Tests Pass — Vercel→Railway Migration Verified
1041 " 🟣 All Verification Checks Pass — kubb.config.ts Railway Migration Complete
1042 3:10p 🔵 New Source Files Are Untracked — Must Be git-added Before Commit
1043 " 🟣 pnpm client build Triggered — Codegen Cache Hit Confirms Turbo Env Key Stability
1044 " 🟣 tsup Build Succeeds — Full Pipeline Complete and Ready to Commit
1045 3:16p 🔵 apps/gateful/openapi/gateful.json Removed from Branch – Multiple Consumers Identified
1046 " 🔵 OpenAPI Spec Resolution Order Documented in README
1047 " 🔵 Jakarta branch CI workflow changes vs origin/dev
1048 " 🔵 Branch fix/dev-script-multi-api-v1 full diff scope vs origin/dev
1049 " 🔵 Deleted CI workflow files confirmed absent from working tree
1050 3:17p 🔴 prepare-spec.mjs Updated to Use Shared Spec Resolver with HTTP Fallback
1051 " 🔵 Deleted CI workflows enforced static gateful.json — now obsolete after dynamic spec fetch
1052 " 🔵 tsx Not Available in @anticapture/client-docs Package
1053 " ✅ tsx Added as devDependency to @anticapture/client-docs Package
1054 " 🔴 Pre-existing Peer Dependency Warnings in Monorepo
1056 3:18p 🔴 prepare-spec.mjs Fix Verified Working – Reads Local Spec and Strips 5 Relayer Paths
1055 " 🔵 Release and version CI workflows unchanged by this branch
1057 " ✅ Full Verification Pass: typecheck and lint Clean on Both Affected Packages
1058 " 🔵 HTTP Fallback URL Returns 404 – /docs/json Path May Be Wrong for Production Gateful
1059 " 🔵 Monorepo has no actionlint or YAML workflow linting configured
1060 " 🔵 Production Gateful Lives at gateful.up.railway.app Not gateful-anticapture-production
1061 3:19p 🔴 Full Docs Build Succeeds via HTTP Fallback with NEXT_PUBLIC_GATEFUL_URL=https://gateful.up.railway.app
1062 " 🔴 Docusaurus Full Production Build Completes Successfully
1063 " 🔴 Docs Build Exits 0 – Full Static Site Generated Including LLMs.txt
1064 " 🔵 pnpm-lock.yaml Reformatted – Double to Single Quotes and Added tsx Entry for Docs Package
1065 " ✅ pnpm-lock.yaml Updated Surgically to Add tsx Entry for docs Package
1066 3:20p ✅ Lockfile and docs/package.json Diffs Minimized – Only tsx Addition Remains
1067 " 🔵 Jakarta Workspace Active Modifications Before Fix
1068 " 🔴 Final Verification Pass Complete – All Checks Green After Minimal Lockfile Patch
1069 " 🔴 CI Workflow Conditions Tightened for changeset-release Branches
1070 " 🔵 Lint Fails on Docusaurus-Generated Files After docs Build
1071 " 🔵 Full Branch Diff Reveals Prior CI Additions vs origin/dev
1072 3:21p 🔴 ESLint Config Fixed to Ignore Docusaurus-Generated Files
1073 " 🔵 CI Skip Logic Verified Correct for All Four Scenarios
1074 " ✅ Complete Fix Confirmed – 9 Modified Files, No Leftover Artifacts
1075 3:26p 🔵 MCP Server Dockerfile Also Runs codegen Without gateful.json – Same Root Cause
1076 " 🔴 NEXT_PUBLIC_GATEFUL_URL Fallback Added to Both MCP Server and Docs Dockerfiles
1077 3:27p 🔴 Codegen Verified Working with NEXT_PUBLIC_GATEFUL_URL; All Checks Pass; Docker Build Started
1078 3:28p 🔵 Working Tree Shows Only 3 Modified Files in New Session – Previous Changes Likely Committed
1079 " 🔴 Final State: Both Dockerfiles Have ENV Fallback; All Verification Checks Pass

Access 426k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>
