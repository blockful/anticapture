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

# [jakarta] recent context, 2026-06-02 6:17pm GMT-3

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (19,043t read) | 647,540t work | 97% savings

### Apr 28, 2026

420 1:25p 🟣 All CI checks pass after toJsonValue fix; package ready for commit

### Apr 29, 2026

452 11:14a 🔵 update-agents-md automation memory file missing
453 11:15a 🔵 Anticapture monorepo app/package inventory and command map
454 " 🔵 AGENTS.md is nearly empty and root package.json has notable quirks
455 " ✅ AGENTS.md updated with Apr 29 2026 workflow discoveries
456 " 🔵 $CODEX_HOME not expanded in sandbox — automation memory write failed
457 " ✅ Automation memory file written using absolute path workaround
568 10:54p 🔵 ripgrep not available in workspace environment
569 " 🔵 @anticapture/mcp package structure and capabilities discovered
570 " 🔵 @anticapture/mcp test suite uses in-memory and real HTTP server patterns
571 " 🔵 openapiTools.ts dynamically generates MCP tools from gateful.json OpenAPI spec at module load time
572 10:55p 🔵 All 4 MCP tests pass; @anticapture/client codegen runs via kubb before each test run
573 " 🔵 anticapture-mcp binary not available via pnpm exec without building and linking first
574 " 🔵 anticapture-mcp HTTP server confirmed working via curl smoke test

### Apr 30, 2026

575 10:51a 🔴 Exclude zero-address delegate from ENS lookups in useTopAccountsChartData
597 1:15p 🔵 Code Review: PR #1818 — SEO Improvements for Anticapture Dashboard
598 1:16p 🔵 PR #1818 Workspace Context: Branch Ahead 249 Commits, Vercel Build Failing
599 1:17p 🔵 Confirmed Runtime Crash Bug in proposals/[proposalId]/page.tsx generateMetadata
600 " 🔵 Source Inspection Confirms JsonLd Escaping Gap, Sitemap Limits, and getSiteUrl Localhost Issue
601 " 🔵 Confirmed Unrelated Config Changes Bundled Into SEO PR and New llms.txt Route
602 1:18p 🔵 Critical: Sitemap URLs Point to Routes That next.config.ts Permanently Redirects Away
603 " 🔵 PR Diff Scope Clarified: governance/proposal Route Exists in Dev But Not Modified by PR
604 " 🔵 Dashboard TypeCheck Passes on PR Branch; Lint Running
605 1:19p 🔵 Dashboard Lint Passes Clean: 79 Warnings, 0 Errors, None from PR Files
606 " 🔵 All Dashboard Tests Pass: 126/126 Across 16 Suites, None Cover New SEO Code
607 1:20p 🔵 Vercel Build Failure Confirmed: No Log URL Available via GitHub API
608 " 🔵 Vercel Build Root Cause: sitemap.xml Route Times Out After 60 Seconds × 3 Attempts
609 1:21p 🔴 Added export const dynamic = "force-dynamic" to sitemap.ts to Fix Vercel Build Timeout
610 1:40p 🔵 UI Screenshots Reviewed for Bug Fix in anticapture/ottawa Project
611 2:02p 🔵 ripgrep (rg) not available in anticapture/ottawa workspace
612 " 🔵 Dashboard uses Jest for unit tests, Vitest only for Storybook
614 2:03p 🔵 Proposal Fetch Feature with 100-Limit API Parameter
613 " 🔵 Dashboard Jest config: ts-jest, node env, `.test.ts` only, no `.tsx` tests
615 " 🔴 Offchain proposal redirect changed from `redirect` to `permanentRedirect` (308)
616 " 🔵 sitemap.ts getAllProposalPaths Uses Suboptimal Limits (10 and 20)
617 " 🔵 Jest testMatch pattern misses bracket-directory test files when passed as path argument
618 " 🔵 sitemap.test.ts Exists Alongside sitemap.ts
619 " 🔵 Jest bracket-glob issue persists even when shell-quoting the path argument
620 " 🔵 Workaround: use `jest --runTestsByPath` to target bracket-directory test files
621 2:04p ✅ TypeCheck passes after `redirect` → `permanentRedirect` change
622 " ✅ Lint passes with 0 errors after permanentRedirect fix; 79 pre-existing warnings unrelated to change
623 2:32p 🔵 Offchain Proposals Intentionally Route to /governance/offchain-proposal Path
624 2:38p 🔵 Anticapture Guardrails and Dashboard Frontend Skills Loaded
625 " 🔵 Anticapture Monorepo Guardrail Boundaries and Verification Commands Established
626 2:39p 🔵 AGENTS.md Files Found in Ottawa and Tianjin Workspaces
627 " 🔵 Dashboard Package Technology Stack Identified
628 " 🔵 Ottawa Workspace is a Partial Monorepo Subset
629 " 🔴 Sitemap Proposal Fetching Made Fault-Tolerant with Per-Source Error Isolation
630 " 🔴 Sitemap Fault-Tolerance Fix Verified — All 5 Tests Pass

### Jun 2, 2026

695 3:46p 🔴 CI codegen fixed to target Railway PR-preview gateful via dynamic URL

Access 648k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>
