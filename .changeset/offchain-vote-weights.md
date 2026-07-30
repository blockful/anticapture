---
"@anticapture/api": minor
"@anticapture/gateful": minor
---

Expose per-choice weights on off-chain votes. Weighted and quadratic ballots are
stored as `{choiceIndex: weight}`, but the response reduced that to the choice
indices and discarded the weights, so a voter's split could not be read back.
Off-chain votes now also carry a `weights` object, null for vote types that have
no weights. `choice` is unchanged.
