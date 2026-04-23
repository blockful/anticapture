---
name: observability-release
description: Use when releasing a new version of the @blockful/observability package — covers version bump, tagging, pushing, and the GitHub Packages publish flow. Triggers on "publish observability", "release observability", "bump observability version", or any change to packages/observability/ that needs to reach external consumers.
---

# Observability Package Release Guide

## Use This Skill When

- You changed code in `packages/observability/` and external consumers (e.g. `blockful/notificationSystem`) need the update.
- The user asks to "publish", "release", "bump", or "tag" the observability package.
- You are debugging a failed publish run in `.github/workflows/publish-observability.yaml`.

**Do NOT use this skill** for internal-only changes consumed via `workspace:*` inside the monorepo — those don't need a publish. The version on the registry only matters for repos outside `anticapture/`.

## Background: Why Tags, Not Main

Publishing is triggered by pushing a tag matching `observability-v*`, **not** by merging to main. Reasons:

- Registry versions are **immutable** — publishing `1.0.2` twice fails. Main-triggered publishing forces a version bump on every merge, even for unrelated monorepo changes.
- Tags let you **batch** several merged PRs into one meaningful release.
- Tags make rollback trivial ("don't push the bad tag") vs. main-triggered ("already shipped before I noticed").

Related files:

- Workflow: `.github/workflows/publish-observability.yaml`
- Package: `packages/observability/package.json`
- Spec/history: `packages/observability/PUBLISH_SPEC.md`

## Release Checklist

Run these steps in order. Do not skip verification.

### 1. Decide the version bump (semver)

| Change type                              | Bump  | Example       |
| ---------------------------------------- | ----- | ------------- |
| Bug fix, internal refactor, doc update   | patch | 1.0.1 → 1.0.2 |
| New exported function or optional param  | minor | 1.0.1 → 1.1.0 |
| Renamed export, removed API, arg changed | major | 1.0.1 → 2.0.0 |

If unsure, ask the user. Default to patch.

### 2. Pre-publish verification

From the repo root:

```bash
pnpm --filter @blockful/observability typecheck
pnpm --filter @blockful/observability lint
pnpm --filter @blockful/observability build
```

All three must pass. The CI workflow does NOT run typecheck/lint — publishing broken types is silent until a consumer installs.

### 3. Bump the version

Edit `packages/observability/package.json` — update the `"version"` field. Do **not** use `pnpm version` / `npm version` (they create a tag with the wrong name format; our workflow requires the `observability-v` prefix).

### 4. Commit the bump

```bash
git add packages/observability/package.json
git commit -m "chore(observability): release v<NEW_VERSION>"
```

Keep this commit isolated — do not bundle unrelated changes. It makes rollback cleaner.

### 5. Tag and push

```bash
git tag observability-v<NEW_VERSION>
git push origin <branch>
git push origin observability-v<NEW_VERSION>
```

The tag name **must** match `observability-v*` — the workflow filter on `tags: ['observability-v*']` is what triggers publishing.

### 6. Verify CI

- Watch the run in GitHub Actions (`Publish @blockful/observability` workflow).
- On success, confirm the new version appears at
  https://github.com/blockful/anticapture/pkgs/npm/observability
- If the workflow fails, see **Troubleshooting** below. Do NOT retry by force-pushing the tag — delete it and push a new patch version instead.

### 7. Notify consumers

External consumers (e.g. `notificationSystem`) need to bump their dependency:

```bash
pnpm --filter <app> update @blockful/observability
```

Internal monorepo consumers use `workspace:*` and are unaffected.

## Rules

- **Never republish the same version.** GitHub Packages rejects it; even if it didn't, consumers already have `1.0.1` cached in lockfiles.
- **Never delete a published version to "fix" it.** Deprecate + bump instead:
  ```bash
  npm deprecate @blockful/observability@<bad-version> "reason" --registry=https://npm.pkg.github.com
  ```
  Then bump to a new patch and publish the fix.
- **Never force-push a tag.** Delete and recreate with a new version number.
- **Do not edit the workflow file as part of a release.** Workflow changes belong in a separate PR, merged before the release commit.

## Troubleshooting

### Workflow fails with 403 on publish

- Check `permissions: packages: write` is present in the workflow.
- First publish under the `blockful` org may require org admin approval — check org package settings.

### `ERR_PNPM_NO_MATCHING_VERSION` in consumer after publish

- The consumer's `.npmrc` is missing the `@blockful:registry=https://npm.pkg.github.com` line.
- Or the `NODE_AUTH_TOKEN` / `GITHUB_TOKEN` env var is unset.

### Workflow publishes but types are broken for consumers

- You skipped step 2. Bump a new patch, publish the fix.
- Check `"files": ["dist"]` in `package.json` — if `dist/` isn't in the tarball, consumers get `Cannot find module`.

### Tag pushed but workflow didn't run

- Tag name probably doesn't match `observability-v*` exactly (e.g. used `v1.0.2` or `observability/v1.0.2`).
- Delete the wrong tag locally + remote, push a correctly-named one:
  ```bash
  git tag -d <wrong-tag>
  git push origin :refs/tags/<wrong-tag>
  ```

## Worked Example: releasing 1.0.2

```bash
# 1. verify
pnpm --filter @blockful/observability typecheck
pnpm --filter @blockful/observability lint
pnpm --filter @blockful/observability build

# 2. bump version in packages/observability/package.json from 1.0.1 to 1.0.2

# 3. commit + tag + push
git add packages/observability/package.json
git commit -m "chore(observability): release v1.0.2"
git tag observability-v1.0.2
git push origin feat/my-branch
git push origin observability-v1.0.2

# 4. watch Actions → confirm package page shows 1.0.2
```
