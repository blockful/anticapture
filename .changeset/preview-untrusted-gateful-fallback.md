---
"@anticapture/dashboard": patch
"@anticapture/client": patch
---

Drop the shared-dev-Gateful fallback for untrusted/fork Vercel PR previews. Those previews get no PR-scoped Railway service, so they can never reflect a PR's API/Gateful changes — pointing them at `dev-gateful` only produced a misleading preview. The dashboard `next.config.ts` and the `@anticapture/client` Gateful OpenAPI spec resolver now rely solely on an explicit `ANTICAPTURE_API_URL` (injected by CI for trusted PRs / set on dev & production) or a Railway PR-preview environment; anything else throws instead of silently falling back.
