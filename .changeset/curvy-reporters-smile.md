---
"@anticapture/dashboard": patch
---

Move data inconsistency report trigger from Help dropdown to inline Flag icon in each panel. The panel name is now structurally correct (it's literally where you clicked), removing the need for the dropdown, `report-panels.ts` constants, the `section` field, and the server-side allowlist.
