---
"@anticapture/api": minor
"@anticapture/gateful": minor
"@anticapture/dashboard": minor
---

Holders & Delegates v3 (DEV-562, DEV-476)

API: new endpoints backing the module. `GET /:dao/voting-powers/inactive-summary`
(delegated VP parked with inactive delegates), `GET /:dao/accounts/:address/delegators/historical`
(former delegators with VP impact, start/end and redelegation target), and
`GET /:dao/addresses/labels` (per-DAO treasury/vesting labels). Adds an optional
`address` filter to `GET /:dao/feed/events`, and an optional `toDate` upper bound
to `GET /:dao/proposals-activity` so a bounded period counts only the proposals
inside it. That upper bound is keyed on when a proposal's voting opens (creation
plus the DAO voting delay), not on when it was created, so on DAOs with a
non-zero voting delay a proposal created inside the period whose voting only
opens after it no longer counts: no vote could land in the window, and counting
it marked delegates inactive on proposals they could not yet vote on. On
`GET /:dao/voting-powers/inactive-summary` that also keeps `totalProposals` at
zero when the window holds nothing votable, instead of reporting every delegate
as inactive. Both `GET /:dao/proposals-activity` and
`GET /:dao/voting-powers/inactive-summary` also bound the vote by `toDate`: a
proposal that opens near the end of the period stays votable after it, so a vote
cast later no longer counts as activity inside a period that closed before the
vote existed. The proposal is still listed, with no vote attached. The same bound
applies at the other end: a proposal whose voting period overlaps `fromDate` is
in scope, but a vote cast on it before that date happened outside the period and
no longer counts as activity inside it either. On
`GET /:dao/accounts/:address/delegators/historical`, `amount` reports the voting
power the queried address actually lost at the move away rather than the value
stored on the last delegation event: balances that move while a delegation stands
write no delegation row, so that value is a stale snapshot, and the share it
represented is instead applied to the balance the move-away event carries. Full
delegation therefore reports the whole balance moved, and partial delegation
(SCR) keeps its fraction rather than claiming the sibling delegates' part. On AAVE, `fromValue`/`toValue` on `GET /:dao/voting-powers` now filter the
delegated voting power alone instead of the combined total (delegated power plus
the account's own balance), matching both the `votingPower` ordering on the same
endpoint and every other DAO's behavior, so the range a client asks for matches
the delegation figure it renders.
Feed DELEGATION metadata gains an optional `delegatees` array of
`{ delegate, amount }`, present only when the source event split voting power
across more than one delegatee (partial delegation, as SCR does), ordered by
delegate address ascending; `delegate`/`amount` stay as they were and describe
the primary delegatee, so existing consumers are unaffected. Gateful re-exposes
the expanded surface through its aggregated OpenAPI spec (no gateway code
change).

Dashboard: value min/max filters on the Delegates and Token Holders tables;
Delegates as the default tab and the sidebar renamed to "Stakeholders"; larger
rows with bottom borders and a continuous activity ring; voting power shown as a
percentage of quorum; inactive-delegate flagging and 0/0 activity states
("Inactive" / "No proposals" / "Never voted"); the inactive-VP alert banner on
Token Holders; clickable addresses that re-point the drawer everywhere; a
per-address Activity tab in the drawer, on the DAOs that serve the activity
feed; Buy/Sell relabeled to In / Out / Vested;
a dust badge and "Hide dust" switch on Top Interactions; a "Filter low importance"
toggle and "All time" range on Voting Power History; a MAX option and a custom
calendar range on the time selector, single days included; and a Former
Delegators view in the
delegate profile.
