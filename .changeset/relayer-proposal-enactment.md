---
"@anticapture/relayer": minor
---

Add POST /relay/queue and /relay/execute endpoints that sponsor the
permissionless Governor lifecycle transactions. Proposal args are fetched from
the Anticapture API by proposal id and verified trustlessly against the
governor's hashProposal before anything is signed.
