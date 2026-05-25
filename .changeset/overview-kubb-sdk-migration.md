---
"@anticapture/dashboard": minor
---

Migrate DAO Overview data hooks from GraphQL client to Kubb SDK REST API. The `useDaoOverviewData`, `useDaoTreasuryStats`, `useCompareTreasury`, and `useLastProposals` hooks now use `@anticapture/client` hooks instead of `@anticapture/graphql-client`.
