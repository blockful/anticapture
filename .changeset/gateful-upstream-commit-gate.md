---
"@anticapture/api": patch
"@anticapture/gateful": patch
---

Stop the production dashboard build from generating its SDK against the
previous release's OpenAPI spec.

Gateful merges the DAO APIs' specs into `/docs/json` on every request, so the
deploy gate waiting for gateful's own commit proved nothing about the schemas
it would serve: on #2093 gateful reported the new commit at 14:33:54, codegen
read the spec at 14:34:23, and `ens-api` only came up at 14:34:34 — the
dashboard build failed on a field the API hadn't started advertising yet.

The DAO API now reports its running commit on `/health`, and gateful passes it
through as `upstreams.<dao>.commit` alongside an `upstreams.<name>.kind`.
`scripts/wait-for-gateful.mjs` then holds the deploy until every `dao-api`
upstream reports a commit in `EXPECTED_UPSTREAM_SHAS` — the last commit that
touched the paths Railway watches to rebuild those APIs, plus everything after
it. Expressing it as "that commit or newer" rather than "does this push change
the API" keeps the gate correct when a non-API push supersedes an in-flight API
push, and when a push carries more than one commit. A DAO API reporting no
commit counts as stale (the previous release is still answering); relayers,
address enrichment and authful contribute no schemas and only have to be
reachable.

`@anticapture/client#codegen` is also no longer cached by turbo: its real input
is a live URL no hash can see, so the poisoned output above was replayed on
every retry of that commit and no re-run could ever fix it.
