# mcp-server

Serves `@anticapture/client`'s generated MCP tools over HTTP.

## The OpenAPI spec is a hidden input to a cached build layer

`Dockerfile` runs `pnpm --filter @anticapture/client codegen`, and that codegen
fetches the OpenAPI document over the network from a **running** Gateful
(`src/gateful-openapi-spec.ts`) — the preview environment's own Gateful in a PR,
`ANTICAPTURE_API_URL` on dev/production. The tool schemas are frozen into the
image at build time, not read at boot.

BuildKit cannot see that input. The cache key for

```
RUN pnpm --filter @anticapture/client codegen && pnpm --filter @anticapture/client build
```

covers only the pruned `@anticapture/client` workspace and the lockfile. A change
to `apps/api` alters the spec but touches neither, so the layer is **reused** and
the image ships tool schemas generated against an older contract. The symptom is
an MCP tool whose advertised schema does not match what the API returns, with
nothing in the diff to explain it.

Observed on this PR: `apps/api` flattened `TokenPropertiesResponse`, Gateful
served the new shape immediately, and three consecutive MCP deploys kept
advertising the old one — the build log shows
`[installer 8/8] RUN pnpm … codegen … cached: true` every time.

What does **not** clear it:

- an empty commit — `watchPatterns` in `railway.json` filter on changed paths, so
  Railway marks a no-file commit `SKIPPED`;
- touching a file outside the pruned client workspace (this README, for one);
- the API's plain redeploy, which reuses the existing image by design.

What does: a no-cache rebuild, or any change inside
`packages/anticapture-client/**`.

The durable fixes are to make the spec a visible input (`ADD <spec-url>` before
the codegen step, so BuildKit hashes the fetched document) or to resolve the spec
at container start instead of at build. Neither is done here.
