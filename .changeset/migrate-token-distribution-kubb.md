---
"@anticapture/dashboard": patch
---

Migrate token distribution data fetching from GraphQL client to Kubb REST SDK (`@anticapture/client`). Replaces `useGetProposalsQuery`, `useTokenMetricsLazyQuery`, and `useHistoricalTokenDataQuery` with their REST counterparts.
