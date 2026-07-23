---
"@anticapture/api": minor
"@anticapture/gateful": minor
"@anticapture/dashboard": minor
---

Holders & Delegates v3 (DEV-562, DEV-476)

API: new endpoints backing the module — `GET /:dao/voting-powers/inactive-summary`
(delegated VP parked with inactive delegates), `GET /:dao/accounts/:address/delegators/historical`
(former delegators with VP impact, start/end and redelegation target), and
`GET /:dao/addresses/labels` (per-DAO treasury/vesting labels). Adds an optional
`address` filter to `GET /:dao/feed/events` and an optional `proposalStatusIn`
filter to `GET /:dao/proposals-activity`. Gateful re-exposes the expanded surface
through its aggregated OpenAPI spec (no gateway code change).

Dashboard: value min/max filters on the Delegates and Token Holders tables;
Delegates as the default tab and the sidebar renamed to "Stakeholders"; larger
rows with bottom borders and a continuous activity ring; voting power shown as a
percentage of quorum; inactive-delegate flagging and 0/0 activity states
("Inactive" / "No proposals" / "Never voted"); the inactive-VP alert banner on
Token Holders; clickable addresses that re-point the drawer everywhere; a
per-address Activity tab in the drawer; Buy/Sell relabeled to In / Out / Vested;
a dust badge and "Hide dust" switch on Top Interactions; a "Filter low importance"
toggle and "All time" range on Voting Power History; a MAX option and custom
calendar range on the time selector; a Former Delegators view in the delegate
profile; and a proposal final-result filter on the votes tab.
