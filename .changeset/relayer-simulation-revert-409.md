---
"@anticapture/relayer": patch
"@anticapture/gateful": patch
"@anticapture/dashboard": patch
---

Answer a gasless vote or delegation that would revert on-chain (a vote already cast, a used nonce) with 409 SIMULATION_FAILED instead of 500 INTERNAL, documented in the relay routes Gateful exposes, and make a gasless vote reach the relayer once: the dashboard checks hasVoted before asking for a signature, confirms the relayed transaction on the DAO's chain instead of through the wallet, never reports a relayed vote as failed, and keeps the vote's submission state across modal closes and remounts so the ballot is not offered again
