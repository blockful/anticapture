---
"@anticapture/client": minor
---

The MCP HTTP server no longer does an equality check against the shared `ANTICAPTURE_MCP_API_KEY` (now removed). Token validation is delegated to Gateful: callers present their own per-tenant token, which the MCP server forwards upstream (`FORWARD_CLIENT_AUTH=true`) for Gateful's `tokenAuthMiddleware` to validate and attribute per tenant. Validation is intentionally not duplicated at the MCP layer — Gateful owns it, including the Redis cache and fail-open fallback that keep cache-warm tenants serving through an Authful restart.
