---
"@anticapture/dashboard": patch
---

Fix "Failed to vote" on GovernorBravo DAOs (UNI, COMP, GTC, Nouns): castVote simulation used an OZ Governor ABI declaring a uint256 return, but Bravo's castVote returns no data, making viem throw before the wallet opened. Votes now simulate with a void-return ABI.
