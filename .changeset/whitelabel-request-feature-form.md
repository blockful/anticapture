---
"@anticapture/dashboard": minor
---

Add an in-app "Request a Feature" form to the whitelabel dashboard. The sidebar
button now always renders: DAOs without a `requestFeatureLink` (like Uniswap)
open the new `/request-feature` page, which emails the request via Resend, so
no per-DAO ClickUp form is needed. DAOs with an explicit `requestFeatureLink`
(ENS, Shutter) keep linking to their existing external forms.
