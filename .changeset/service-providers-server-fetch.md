---
"@anticapture/dashboard": patch
---

The Service Providers page now loads its data through the dashboard's own server instead of calling raw.githubusercontent.com from the browser. Visitors on networks that block that host, or on VPN addresses GitHub refuses, saw "Unable to load service provider data".
