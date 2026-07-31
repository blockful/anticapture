---
"@anticapture/dashboard": patch
"@anticapture/user-api": patch
---

Address PR review findings: keep the optimistic off-chain tally applied until
the replacement vote is actually indexed (and poll for it), drop optimistic
scores for ranked/quadratic ballots whose tally can't be predicted locally, use
Snapshot's `scores_total` as the turnout denominator for approval winners, stop
offering "Change vote" once voting has closed, render ENS avatars unoptimized so
arbitrary avatar hosts still load, align the validation metrics' activity day
with Authful's UTC usage buckets, drop retained daily figures at the day
boundary, and stop requiring `USER_API_METRICS_TOKEN` at boot.
