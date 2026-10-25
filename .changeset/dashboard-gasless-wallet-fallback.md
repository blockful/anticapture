---
"@anticapture/dashboard": minor
---

Offer gasless votes only when the relayer's GET /relay/status answers available: true, and keep every other case on the voter's own wallet: the ballot says when gas-free voting is unavailable or a relayed attempt was refused and switches its button to "Vote with wallet", lets a voter opt out of the relayer at any time, and turns a relay the relayer never confirmed into a "Vote with my wallet instead" button once the chain shows no vote from that address. Delegation gets the same guarantee: a refused or unconfirmed gas-free delegation moves that account to its wallet with a "Delegate with my wallet" button. The fallback state follows the voter across account switches and remounts, a relayed vote whose hash never confirms can also fall back once the chain shows no vote and no pending relay, a wallet vote that finds the relayed vote already counted reports it as cast, and the relayer status refreshes every minute while a page is open
