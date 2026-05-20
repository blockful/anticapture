---
"@anticapture/api": minor
---

Replace the dedicated lean proposal endpoints with a `lean` query param.

The six `/proposals/lean*` and `/offchain/proposals/lean*` routes are removed.
Pass `lean=true` on the existing routes instead — `GET /{dao}/proposals`,
`/proposals/search`, `/proposals/{id}`, `/offchain/proposals`,
`/offchain/proposals/search`, and `/offchain/proposals/{id}` all now accept
the flag and drop the heavy fields (`calldatas`/`values`/`targets` on
onchain, `body` on offchain) when set. The default remains the full payload
so existing clients see no behavior change.

The `OnchainProposal.calldatas/values/targets` and `OffchainProposal.body`
fields are now optional in the OpenAPI schema, reflecting the runtime
contract more truthfully than before.
