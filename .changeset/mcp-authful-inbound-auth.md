---
"@anticapture/client": minor
---

The MCP HTTP server now authenticates every inbound request against Authful (the per-tenant token store) instead of an equality check against the shared `ANTICAPTURE_MCP_API_KEY`. Set `TOKEN_SERVICE_URL` + `TOKEN_SERVICE_API_KEY` (same names Gateful uses) to enable: callers present their own Authful token, which is validated before any operation (invalid → `401`, Authful unreachable → `503`) and forwarded upstream so Gateful re-validates and attributes usage per tenant. `ANTICAPTURE_MCP_API_KEY` is removed; with auth unset, all requests are allowed (dev only).
