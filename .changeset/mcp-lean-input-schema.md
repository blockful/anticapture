---
"@anticapture/client": patch
---

Stop advertising `lean` on the MCP proposal tools. Those tools always call the REST endpoints with `lean=true`, so the parameter was accepted from callers and then silently overridden. It's now omitted from the input schemas (and dropped entirely from the by-id tools, where it was the only param).
