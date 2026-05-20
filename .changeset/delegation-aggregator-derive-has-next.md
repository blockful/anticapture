---
"@anticapture/api-gateway": patch
"@anticapture/gateful": patch
---

Stop reading `pageInfo` from the upstream `/delegation-percentage` response
in the average-delegation aggregators. The API contract no longer exposes
`pageInfo` on `DelegationPercentageResponse`; both aggregators now derive
`hasNextPage` from `items.length < totalCount` per DAO. The public
`pageInfo` on the aggregated response is unchanged.
