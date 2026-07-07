---
"@anticapture/dashboard": minor
---

Add Shutter DAO whitelabel governance frontend. Enables the whitelabel route for Shutter with its navy brand color, and adds Azorius (`submitProposal`) support to the proposal creation flow so Shutter proposals can be created alongside the existing OZ Governor path. The Execute button for Shutter proposals now only appears once the Azorius timelock has elapsed (status `PENDING_EXECUTION`), instead of showing during the ~2-day timelock window where execution reverts on-chain.
