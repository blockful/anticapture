---
"@anticapture/dashboard": patch
---

Fix voting on Shutter-encrypted offchain proposals (e.g. ENS Copeland elections). The vote choice is now Shutter-encrypted before submission, so the Snapshot sequencer no longer rejects encrypted-privacy proposals with "invalid choice".
