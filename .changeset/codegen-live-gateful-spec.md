---
"@anticapture/client": patch
---

Resolve the Gateful OpenAPI spec exclusively from the live Gateful URL for both codegen and docs build, dropping the committed `apps/gateful/openapi/gateful.json` fallback so generated output never comes from a stale local file.

Wait for Gateful's `/docs/json` endpoint before Docker-time client codegen and docs builds so Railway PR previews do not fail when dependent images start before the Gateful preview is ready.
