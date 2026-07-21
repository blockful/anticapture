# @anticapture/client-docs

Docusaurus site for the Anticapture API documentation, served at
[anticapture.xyz/docs](https://anticapture.xyz/docs).

## How the API reference is built

The OpenAPI reference is **not** generated from committed spec files. At build
time, `scripts/prepare-spec.mjs` fetches the OpenAPI spec from the **live
Gateful deployment** (resolved by `scripts/gateful-openapi-spec.mjs` from
`ANTICAPTURE_API_URL` / `RAILWAY_ENVIRONMENT_NAME`), filters it, and writes it
to `openapi/` for the Docusaurus OpenAPI plugin. Docs and client codegen
therefore always generate from the same source.

The consequence: the published docs reflect whatever spec Gateful served _at
the moment the docs were last built_ — deploying Gateful alone does not
refresh them.

## When the docs deploy

The site runs as a Railway service built from `infra/docs/Dockerfile`. Two
triggers produce a deployment:

1. **Docs changes** — Railway auto-deploys on pushes to `dev`/`main` that
   touch `packages/anticapture-client/docs/**` or `infra/docs/**`
   (`watchPatterns` in `infra/docs/railway.json`).
2. **Gateful deploys** — the `redeploy-docs` job in
   `.github/workflows/deploy.yaml` runs on every push to `dev`/`main`. It
   waits for Gateful to serve that exact commit (`scripts/wait-for-gateful.mjs`
   — rebuilding earlier would bake in the old spec), then calls Railway's
   `serviceInstanceDeployV2` mutation so the docs rebuild against the freshly
   deployed spec. `infra/docs/Dockerfile` references `RAILWAY_GIT_COMMIT_SHA`
   in the build step so these rebuilds bypass Railway's layer cache even when
   no docs file changed.

### Required GitHub secrets

Set per GitHub environment (`dev` and `production`):

| Secret                    | Value                                                                  |
| ------------------------- | ---------------------------------------------------------------------- |
| `RAILWAY_TOKEN`           | Railway **project token** scoped to the matching Railway environment   |
| `RAILWAY_DOCS_SERVICE_ID` | Service id of the docs service (Railway dashboard → docs service → id) |

If either secret is missing, the job logs a warning and skips instead of
failing the deploy.

## Local development

```bash
pnpm client-docs start   # dev server (fetches the spec on start)
pnpm client-docs build   # production build into build/
```

`ANTICAPTURE_API_URL` selects which Gateful the spec is fetched from and is
required (on Railway PR previews the URL is derived from
`RAILWAY_ENVIRONMENT_NAME` instead); the resolution rules live in
`scripts/gateful-openapi-spec.mjs`.
