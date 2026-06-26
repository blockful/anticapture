---
"@anticapture/client": patch
---

Resolve the Gateful OpenAPI spec from the matching PR-preview Gateful on Vercel previews (derived from `VERCEL_GIT_PULL_REQUEST_ID`), so codegen-dependent builds (e.g. dashboard/storybook) no longer fail with "Config failed loading" when neither `ANTICAPTURE_API_URL` nor `RAILWAY_ENVIRONMENT_NAME` is set.
