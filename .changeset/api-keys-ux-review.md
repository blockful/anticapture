---
"@anticapture/dashboard": patch
---

API keys page UX review fixes (ClickUp 86ajr888u): the save-key modal keeps
the default modal width (same as the create step), drops the key name and the
em-dash from its description, titles the token block "Key" with a same-size
"MCP" title below it, and no longer shows the "waiting for the first call"
status. Switching the client tab animates the code block height. The keys
table truncates long names with an ellipsis, the usage key switcher is now a
dropdown with a max width (truncating long names), the empty usage state uses
the BlankSlate component, and the usage section is shorter. The connect
section is titled "MCP" with "connect your AI agent" moved into the
description, and the modal close button is the small version. Long key
names are truncated in the usage chart tooltip and legend, and the
stacked-bar-chart legend scrolls instead of wrapping so it no longer
overflows into the x-axis on mobile.
