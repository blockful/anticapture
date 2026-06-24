# Anticapture

## Boundaries

### Never do

- Modify `.env` files containing secrets
- Force push
- Remove or skip failing tests without explanation
- Commit `node_modules`, `.env`, or generated files
- Cast types to `any` or `unknown` without explicitly asked to

## Shared memory

The team's shared agent memory is Claude Code's **auto memory**, redirected to the git-tracked
`.agents/shared-memory/` folder so one dev's learnings reach another dev's agent via push/pull.
Claude reads it at session start and writes to it automatically — there is no manual step.

- **Setup (once per dev):** run `pnpm setup:memory`, then restart the session. Inspect with `/memory`.
- **Never write** secrets, tokens, `.env` values, or machine-local absolute paths; keep entries
  repo-relative.
- It is **not curated** — review `git status` in that folder before committing what Claude wrote.

Full guidance in `AGENTS.md` and `.agents/shared-memory/README.md`.

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
              └──> Gateful (aggregates DAO APIs into one REST/OpenAPI surface)
                        │
                        ├──> Client SDK (Kubb: generates TS types + React Query hooks)
                        │         │
                        v         v
                      Dashboard (Next.js frontend)
```

### Components Summary

| Component      | Port  | Purpose                                               |
| -------------- | ----- | ----------------------------------------------------- |
| **Indexer**    | 42069 | Blockchain event indexing (Ponder)                    |
| **API**        | 42069 | REST API with OpenAPI (Hono + Drizzle)                |
| **Gateful**    | 4001  | Unified REST/OpenAPI gateway aggregating DAO APIs     |
| **Client SDK** | —     | Generated TypeScript types & React Query hooks (Kubb) |
| **Dashboard**  | 3000  | Next.js frontend with DAO analytics                   |

## Dependency Graph (startup order)

For a full local stack, start services in this order:

1. `pnpm api dev`
2. `pnpm gateful dev`
3. `pnpm client codegen`
4. `pnpm dashboard dev`

Common development workflows:

- **UI implementation**: Run client and dashboard pointing to dev `gateful`
- **API feature**: Run API with dev envs, then gateful, then client + dashboard (only run gateful and frontend when asked)
- **Full stack**: Start all services in order (rare, prefer using Railway dev services)

> **For detailed conventions and strategies per package, see the skills in `.agents/skills/`.**

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

## Changesets (versioning + changelogs)

Every PR to `dev` must include a changeset describing the change, OR an empty changeset if the PR cannot ship behavior. The `changeset-check` CI job in `tests.yaml` blocks merges otherwise. Path-filter auto-skips PRs that touch only `**/*.md`, `.github/**`, or `.changeset/config.json`.

### How to add a changeset

Run from the repo root:

```bash
pnpm changeset
```

The CLI asks you to:

1. Select the package(s) the PR affects (space to toggle, enter to confirm). Pick every package you modified; never bundle unrelated packages into one changeset.
2. Choose the bump type per package: `patch` (bugfix / internal change), `minor` (new feature, backwards-compatible), `major` (breaking change). For `0.x` packages, treat `minor` as "anything new" and `major` as "breaking" (semver is loose pre-1.0).
3. Write a one-line summary. This appears verbatim in `CHANGELOG.md` and gets auto-linked to the PR, commit, and author. Write it for someone reading the changelog six months from now; focus on the user-visible behavior, not implementation detail.

Commit the generated `.changeset/<random>.md` file alongside your code changes.

### When to use an empty changeset

For PRs that genuinely cannot affect a package's behavior (CI tweaks not caught by the path filter, comment-only edits, etc.):

```bash
pnpm changeset --empty
```

Commit the resulting empty `.md`. Do not use empty changesets to skip real changes; every behavior change must be documented.

### Special case: OpenAPI / API contract changes

If your PR changes API behavior that affects the generated contract, update the downstream generated artifacts too: Gateful builds its OpenAPI surface from the APIs, and the `@anticapture/client` SDK (Kubb) generates from the Gateful OpenAPI spec. The dependency graph for contract generation points from Gateful to the APIs, so contract changes must version the packages whose schemas are rebuilt.

When a PR touches an API OpenAPI contract file (`apps/api/openapi/**` or the generated spec in `apps/gateful/openapi/**`), add a changeset for `@anticapture/gateful` alongside the API package that changed. The `api-contract-updates.yaml` workflow enforces the Gateful changeset.

### Workspace dep cascades (no action needed from you)

When you bump `@anticapture/observability` or `@anticapture/client`, the consumer packages (apps that depend on them via `workspace:*`) automatically get a `patch` bump and a changelog line referencing the new version. You do not need to write changesets for the consumers; the cascade is handled by `updateInternalDependencies: "patch"` in `.changeset/config.json`.

### Release flow (informational)

- PRs land on `dev` with changesets attached.
- On every push to `dev`, the `version.yaml` workflow opens or updates a single rolling "Version Packages" PR against `dev`. It consumes all pending `.changeset/*.md` files, bumps versions, and writes `CHANGELOG.md` entries.
- Before opening the weekly `dev` to `main` production-deploy PR, merge the "Version Packages" PR first. The `release-readiness.yaml` workflow blocks the `dev` to `main` PR if any unconsumed changesets remain.
- On push to `main`, the `release.yaml` workflow creates git tags, GitHub Releases for every bumped package, and publishes `@anticapture/client` and `@anticapture/observability` to npm (the only two non-private packages).

### Never do

- Hand-edit `version` fields in `package.json`. Changesets owns version numbers.
- Hand-edit `CHANGELOG.md` files. Changesets owns them.
- Delete `.changeset/*.md` files that are not yours; they belong to other open PRs.
- Skip the changeset by labeling or commenting "trivial." If it is truly trivial, use `pnpm changeset --empty`.
