---
"@anticapture/authful": patch
---

Mark request bodies as `required` on the Authful `POST /tokens`, `/validate` and `/usage/batch` routes. Without it, `@hono/zod-openapi` skips validation and substitutes an empty body when a request omits the JSON content-type — letting `POST /tokens` mint a token with a null `tenant` (NOT NULL violation / 500) instead of returning a 400. Malformed and empty bodies are now rejected with 400.
