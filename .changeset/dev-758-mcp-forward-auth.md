---
"@anticapture/client": minor
---

MCP server can now forward each caller's own Authorization header to the upstream Gateful API (enable with `FORWARD_CLIENT_AUTH=true`), laying the groundwork for per-tenant tokens with rate limiting and usage tracking. Disabled by default; existing shared-key behavior is unchanged.
