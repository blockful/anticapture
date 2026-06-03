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

# [islamabad] recent context, 2026-06-03 4:21pm GMT-3

Legend: 🎯session 🔴bugfix 🟣feature 🔄refactor ✅change 🔵discovery ⚖️decision
Format: ID TIME TYPE TITLE
Fetch details: get_observations([IDs]) | Search: mem-search skill

Stats: 50 obs (15,193t read) | 630,818t work | 98% savings

### Jun 2, 2026

768 6:18p 🔵 Backoff/retry logic exists in API for address enrichment
770 " 🔵 Gateful package structure mapped — relayer and address-enrichment are separate modules
771 6:19p 🔵 Gateful circuit breaker already has exponential backoff; relayer proxy has no retry logic
772 " 🔵 Gateful proxy/route.ts uses circuit breaker; relayer.ts is the only proxy missing it
773 " 🔵 Gateful upstream-docs confirms relayer shares one contract across DAOs — first reachable spec wins
774 6:20p 🟣 Backoff/circuit breaker logic added to gateful relayer proxy
775 " 🟣 All 52 gateful tests pass after relayer circuit breaker addition
776 " 🟣 Gateful TypeScript build passes clean after relayer circuit breaker changes
777 " 🔵 Workspace diff shows relayer.test.ts is untracked — not yet staged
778 6:21p 🔵 Existing changeset already covers address-enrichment circuit breaker; relayer change needs a new one
779 " ✅ Changeset created for relayer circuit breaker patch

### Jun 3, 2026

813 10:27a 🟣 ENS Revenue Dashboard — Run-Rate Hero + Timeframe & Chart-Granularity Toggles
814 " 🔵 Existing Revenue Dashboard Code Structure Mapped
815 10:28a 🔵 Revenue Dashboard — Full Codebase Structure Confirmed for Refactor
816 " 🔵 Dashboard Test Infrastructure Confirmed — No Existing Revenue Feature Tests
818 10:29a 🟣 Revenue Dashboard Refactored with RevenueSummaryCard and Multi-Granularity Chart
819 10:30a 🟣 Unit Tests Added for computeRevenueSummary and transformToStreamSeries
820 10:31a 🔵 Test Failures: QoQ Delta Off-by-Rounding and RevenueTotalsItem Missing ETH Fields
821 " 🔵 Typecheck Passes but MAX Timeframe Test Still Fails — actualAmount Mismatch
822 " 🔴 All 7 Revenue Transform Tests Pass — TypeScript and Tests Green
823 " 🔵 Lint Fails on Prettier Formatting in New Revenue Files — 6 Errors in 3 Files
824 10:32a 🔵 Prettier Lint Errors Located — Inline Callbacks and xAxisLabels Line Need Reformatting
826 " 🔴 Prettier Formatting Fixed in Revenue Components and charts.ts
827 " 🔴 Lint Passes Clean — 0 Errors, Only Pre-Existing Warnings
828 10:33a 🔵 Revenue Page Routes Identified for E2E Testing
829 " 🟣 Playwright E2E Tests Added for Revenue Page
830 " 🔴 E2E Test Fixed — SegmentedControl Uses role=radio and aria-checked, Not role=button and aria-pressed
831 " 🟣 Revenue Dashboard Refactor Fully Verified — TypeScript, Tests, and Lint All Green
833 10:34a 🔴 E2E Test Prettier Formatting Fixed — 3 Errors in revenue.spec.ts Resolved
834 " 🟣 Revenue Dashboard Refactor Complete — All Checks Green
835 " 🔵 Dev Server Started for Local Visual Verification of Revenue Dashboard
836 10:35a 🔵 Next.js Dev Server Running at localhost:3000 with Turbopack
837 " 🔵 In-App Browser (iab) Not Available in This Environment
838 " 🔵 Playwright Chromium Browser Not Installed — Downloading Now
839 10:36a 🔵 Playwright Chromium v1208 Installed Successfully
840 " 🟣 Playwright E2E Tests Pass — Revenue Dashboard Fully Verified End-to-End
841 10:37a 🟣 Revenue Dashboard Screenshots Captured for Desktop and Mobile
842 " 🟣 Visual Verification Complete — Revenue Dashboard Confirmed Rendered Correctly in Both Viewports
843 " 🔵 Pre-Existing SSR Error: indexedDB Not Defined During WalletConnect Initialization
845 10:38a 🟣 Loaded Revenue Dashboard Screenshots Captured with Real Data
847 " 🔵 Revenue API Requires Bearer Authentication — 401 Expected for Unauthenticated Requests
848 " 🔵 All Revenue Dashboard Changes Are Uncommitted — Working Tree Status
850 10:39a 🔴 MonthlyRevenueChart: Skip xAxisLabelFormatter and xAxisLabelInterval for Month Granularity
851 " 🟣 Final Verification Pass — All Checks Green After Month Granularity Fix
852 10:40a 🟣 E2E Tests Pass After Month Granularity Fix — Revenue Dashboard Fully Verified
869 2:53p 🔵 Font Inconsistency Reported in Dashboard UI Cards
870 2:54p 🔵 Root Cause Identified: RevenueSummaryCard Uses font-mono for Large Values
871 " 🔵 font-mono Usage Pattern Differs Between Revenue Cards and All Other Dashboard Feature Cards
872 " 🔴 Removed font-mono from Revenue Card Large KPI Values to Match Dashboard Typography
873 2:55p 🔵 Dashboard Lint Passes with 0 Errors; 82 Pre-existing Warnings Unrelated to Revenue Fix

Access 631k tokens of past work via get_observations([IDs]) or mem-search skill.
</claude-mem-context>
