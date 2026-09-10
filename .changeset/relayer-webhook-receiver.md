---
"@anticapture/relayer": minor
---

Add POST /relay/webhook, a private-network receiver for notification-system
events. When the body carries `metadata.proposalId`, the relayer reads the
proposal's on-chain state and sponsors queue() (Succeeded) or execute()
(Queued, eta passed) through the existing enactment service. The route is not
part of the public OpenAPI spec. The server now binds to `::` so Railway
private networking can reach it.
