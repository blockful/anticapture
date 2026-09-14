---
"@anticapture/relayer": minor
---

Add POST /internal/webhook, a receiver for notification-system events. The
route lives under /internal/ so gateful's /:dao/relay/\* proxy cannot reach
it — only Railway's private network can. When the body carries
`metadata.proposalId` for this relayer's own DAO, the relayer reads the
proposal's on-chain state and sponsors queue() (Succeeded) or execute()
(Queued, eta passed) through the existing enactment service; events for
other DAOs (`metadata.daoId`) are ignored. The route is not part of the
public OpenAPI spec. The server now binds to `::` so Railway private
networking can reach it.
