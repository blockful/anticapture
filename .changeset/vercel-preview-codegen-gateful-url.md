---
"@anticapture/client": patch
---

Resolve the Gateful OpenAPI spec from the PR's own preview Gateful on Vercel PR previews (via `VERCEL_ENV` / `VERCEL_GIT_PULL_REQUEST_ID`), mirroring the dashboard's runtime URL logic, so codegen generates the client against the PR's contract instead of dev. Previously the codegen resolver only understood Railway env vars and silently fell back to the dev spec on Vercel, breaking previews for any PR that consumed a not-yet-on-dev field.
