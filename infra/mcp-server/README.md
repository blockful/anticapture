# mcp-server

Serves `@anticapture/client`'s generated MCP tools over HTTP.

## The spec is baked at build time

`Dockerfile` runs `pnpm --filter @anticapture/client codegen`, and that codegen
fetches the OpenAPI document from a **running** Gateful
(`src/gateful-openapi-spec.ts`) — the preview environment's own Gateful in a PR,
`ANTICAPTURE_API_URL` on dev/production. The tool schemas are therefore frozen
into the image at build time, not read at boot.

Railway builds this service and `gateful` in parallel on the same commit, so a
commit that changes the API contract produces an MCP image built against the
**previous** Gateful. The symptom is a tool whose advertised schema does not
match what the API now returns, with nothing wrong in the diff.

When a change touches the spec, rebuild this service once more after Gateful is
live. An empty commit will not do it — `watchPatterns` in `railway.json` filter
on changed paths, and Railway marks a no-file commit `SKIPPED`. Touch something
under one of the watched paths, or redeploy from the dashboard with a rebuild
(the API's plain "redeploy" reuses the existing image, which is precisely the
stale artifact).

Making this ordering explicit — or having the server fetch its spec at boot
instead of at build — would remove the hazard.
