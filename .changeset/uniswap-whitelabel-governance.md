---
"@anticapture/dashboard": minor
---

Enable the Uniswap whitelabel with full governance. `uniswap.gov.blockful.io` now
resolves to the whitelabel shell, and Uniswap joins ENS and Shutter as a DAO you
can draft, publish, vote on, queue and execute proposals for. Proposal creation
goes through a new GovernorBravo `propose(targets, values, signatures, calldatas,
description)` path, which also rejects proposals past the governor's 10-action
`proposalMaxOperations` before they reach the wallet.
