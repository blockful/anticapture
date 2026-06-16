---
"@anticapture/client": patch
"@anticapture/authful": patch
"@anticapture/gateful": patch
---

Standardize environment-variable handling to match the API module. The MCP server now loads `.env` via dotenv and validates `PORT`, `HOST`, `ANTICAPTURE_API_URL`, `ANTICAPTURE_API_KEY`, and `FORWARD_CLIENT_AUTH` through a single zod schema instead of ad-hoc `process.env` reads. Authful's env parsing switches to the same `safeParse` + friendly-error pattern and folds `TOKEN_PLAINTEXT` into the schema so the mint script no longer reads `process.env` directly. Gateful now normalizes `TOKEN_SERVICE_URL` (trailing-slash trimming) in its zod env schema rather than manually inside `AuthfulClient`.
