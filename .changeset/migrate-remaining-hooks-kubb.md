---
"@anticapture/dashboard": patch
---

Migrate remaining shared hooks (`useDelegatedSupply`, `useLastUpdate`, `useConnectedWalletVotingPower`) off `@anticapture/graphql-client` to the kubb SDK, and remove the now-unused `useVotes` and `useTokenInfo` hooks. No user-visible change.
