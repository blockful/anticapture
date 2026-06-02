---
"@anticapture/dashboard": patch
---

Migrate dao-overview hooks and 4 thin shared wrappers (useDaoData, useTokenData, useActiveSupply, useAverageTurnout) from the GraphQL client to the kubb-generated REST SDK (@anticapture/client). Delete unused useCompareTreasury wrapper.
