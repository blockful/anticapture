---
"@anticapture/dashboard": minor
---

Offer gasless votes only when the relayer's GET /relay/status answers available: true, and keep every other case on the voter's own wallet: the ballot says when gas-free voting is unavailable or a relayed attempt was refused and switches its button to "Vote with wallet", lets a voter opt out of the relayer at any time, and turns a relay the relayer never confirmed into a "Vote with my wallet instead" button once the chain shows no vote from that address
