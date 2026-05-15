---
"@anticapture/dashboard": patch
---

perf: fix derived state in effects and remove isMounted pattern

Remove accumulatedProposals state/effect in useProposalsActivity (derive from Apollo cache directly), add lazy initialisers for Map/Set state in useDelegates, add timeout cleanup in SectionComposedChart, and inline hasNextPage arithmetic in useDelegateDelegationHistory.
