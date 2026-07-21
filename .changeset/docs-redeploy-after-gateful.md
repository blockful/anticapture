---
---

CI/infra only — no package code changes. Adds a `redeploy-docs` job to the
deploy workflow so the Railway docs service rebuilds (and re-fetches the live
Gateful OpenAPI spec) after every Gateful deploy on dev and production.
