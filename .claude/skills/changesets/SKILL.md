---
name: changesets
description: Use when preparing a PR — adding a changeset, choosing bump types, empty changesets, API-contract changes, or understanding the version/release flow.
---

# Changesets (versioning + changelogs)

Every PR to `dev` must include a changeset describing the change, OR an empty changeset
if the PR cannot ship behavior. The `changeset-check` CI job in `tests.yaml` blocks merges
otherwise. Path-filter auto-skips PRs that touch only `**/*.md`, `.github/**`, or
`.changeset/config.json`.

## How to add a changeset

Run from the repo root:

```bash
pnpm changeset
```

The CLI asks you to:

1. Select the package(s) the PR affects (space to toggle, enter to confirm). Pick every
   package you modified; never bundle unrelated packages into one changeset.
2. Choose the bump type per package: `patch` (bugfix / internal change), `minor` (new
   feature, backwards-compatible), `major` (breaking change). For `0.x` packages, treat
   `minor` as "anything new" and `major` as "breaking" (semver is loose pre-1.0).
3. Write a one-line summary. This appears verbatim in `CHANGELOG.md` and gets auto-linked
   to the PR, commit, and author. Write it for someone reading the changelog six months
   from now; focus on the user-visible behavior, not implementation detail.

Commit the generated `.changeset/<random>.md` file alongside your code changes.

## When to use an empty changeset

For PRs that genuinely cannot affect a package's behavior (CI tweaks not caught by the
path filter, comment-only edits, etc.):

```bash
pnpm changeset --empty
```

Commit the resulting empty `.md`. Do not use empty changesets to skip real changes; every
behavior change must be documented.

## Special case: OpenAPI / API contract changes

Gateful aggregates the per-DAO API specs, and the `@anticapture/client` SDK (Kubb)
generates from the **live** Gateful OpenAPI spec (`pnpm client codegen` — there is no
committed spec file; codegen waits for a running gateway). So when your PR changes API
behavior that alters the generated contract, regenerate the client and add a changeset
for `@anticapture/gateful` alongside the API package that changed — the gateway's
aggregated surface is what actually ships the contract change.

## Workspace dep cascades (no action needed from you)

When you bump `@anticapture/observability` or `@anticapture/client`, the consumer packages
(apps that depend on them via `workspace:*`) automatically get a `patch` bump and a
changelog line referencing the new version. You do not need to write changesets for the
consumers; the cascade is handled by `updateInternalDependencies: "patch"` in
`.changeset/config.json`.

## Release flow (informational)

- PRs land on `dev` with changesets attached.
- On every push to `dev`, the `version.yaml` workflow opens or updates a single rolling
  "Version Packages" PR against `dev`. It consumes all pending `.changeset/*.md` files,
  bumps versions, and writes `CHANGELOG.md` entries.
- Before opening the weekly `dev` to `main` production-deploy PR, merge the "Version
  Packages" PR first. The `release-readiness.yaml` workflow blocks the `dev` to `main` PR
  if any unconsumed changesets remain.
- On push to `main`, the `release.yaml` workflow creates git tags, GitHub Releases for
  every bumped package, and publishes `@anticapture/client` and `@anticapture/observability`
  to npm (the only two non-private packages).

## Never do

- Hand-edit `version` fields in `package.json`. Changesets owns version numbers.
- Hand-edit `CHANGELOG.md` files. Changesets owns them.
- Delete `.changeset/*.md` files that are not yours; they belong to other open PRs.
- Skip the changeset by labeling or commenting "trivial." If it is truly trivial, use
  `pnpm changeset --empty`.
