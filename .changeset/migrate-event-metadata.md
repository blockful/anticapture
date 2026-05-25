---
"@anticapture/api": minor
"@anticapture/indexer": minor
"@anticapture/dashboard": minor
"@anticapture/gateful": patch
"@anticapture/api-gateway": patch
---

Migrate feed event metadata from a denormalized `feed_event.metadata` JSON column to query-time synthesis against `proposals_onchain`, `votes_onchain`, `delegations`, `transfers`, and `voting_power_history`. Adds discriminated metadata schemas to the OpenAPI contract, supports multi-type filtering on `/feed/events`, and wires the dashboard event-type filter as a multi-select.
