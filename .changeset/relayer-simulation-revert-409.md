---
"@anticapture/relayer": patch
"@anticapture/dashboard": patch
---

Answer a gasless vote or delegation that would revert on-chain (a vote already cast, a used nonce) with 409 SIMULATION_FAILED instead of 500 INTERNAL, tell the voter they already voted, and reload the page however the voting modal is closed after a successful vote
