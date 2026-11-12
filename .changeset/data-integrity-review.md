---
"@anticapture/indexer": patch
"@anticapture/api": patch
"@anticapture/dashboard": patch
---

Correct published governance and supply figures found by the November 2026 data review: GTC abstain votes, GovernorAlpha votes and Governor Charlie are indexed, SCR and OP module ballots (VoteCastWithParams) are counted, Nouns and Lil Nouns proposal edits are applied and NFT burns lower supply, Lil Nouns auctions are indexed and GET /lil_nouns/token no longer 500s without a price, Nouns quorum is read per proposal from for-votes only, GTC governance parameters come from Governor Charlie, token metrics expose the daily close and the dashboard charts it, /health judges freshness from all indexed activity within a day, and the GTC, COMP, AAVE, ARB and Fluid address lists drop third parties, duplicates and wrong contracts. Historical indexer rows change only after the affected DAOs are replayed.
