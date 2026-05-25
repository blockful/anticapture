---
"@anticapture/api-gateway": patch
"@anticapture/gateful": patch
---

Migrate the average-delegation aggregators to the new DAO API pagination
contract.

- Stop reading `pageInfo` from the upstream `/delegation-percentage`
  response. Both aggregators now derive `hasNextPage` from
  `items.length < totalCount` per DAO. The public `pageInfo` on the
  aggregated response is unchanged.
- Drop the `after`/`before` cursor params from the aggregator routes
  (`GET /aggregations/average-delegation-percentage` in gateful and the
  `averageDelegationPercentageByDay` GraphQL field in api-gateway) and
  switch to a `skip` integer that matches the DAO API. The aggregators no
  longer forward stale cursor params to upstream, so requests for later
  pages now actually advance instead of repeating the first slice.
  `pageInfo.hasPreviousPage` is now derived from `skip > 0`.
