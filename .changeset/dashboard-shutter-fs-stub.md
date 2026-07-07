---
"@anticapture/dashboard": patch
---

Fix dashboard production build: stub Node's `fs` module for browser bundles so Turbopack can bundle `@shutter-network/shutter-crypto` used by Shutter offchain voting
