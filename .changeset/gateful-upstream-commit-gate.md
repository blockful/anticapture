---
"@anticapture/api": patch
"@anticapture/gateful": patch
"@anticapture/relayer": patch
"@anticapture/address-enrichment": patch
---

Stop the production dashboard build from generating its SDK against the
previous release's OpenAPI spec.

Gateful merges the DAO APIs' specs into `/docs/json` on every request, so the
deploy gate waiting for gateful's own commit proved nothing about the schemas
it would serve: on #2093 gateful reported the new commit at 14:33:54, codegen
read the spec at 14:34:23, and `ens-api` only came up at 14:34:34 — the
dashboard build failed on a field the API hadn't started advertising yet.

Every service whose OpenAPI gateful merges into `/docs/json` — the DAO APIs,
the relayer and address enrichment — now reports its running commit on
`/health`, and gateful passes it through as `upstreams.<name>.commit` alongside
an `upstreams.<name>.kind`. `scripts/wait-for-gateful.mjs` then holds the
deploy until each of them reports a commit listed for its kind in
`EXPECTED_UPSTREAM_SHAS`: the last commit that touched the paths Railway
watches to rebuild that service, plus everything after it.

Expressing it as "that commit or newer" per service, rather than "does this
push change the API", keeps the gate correct when a push that leaves a service
alone supersedes an in-flight push that changed it, and when a push carries
more than one commit. An upstream reporting no commit counts as stale — the
previous release is still answering — which cannot deadlock, because teaching a
service to report its commit necessarily touches its own watched paths.
Authful contributes no merged schemas and only has to be reachable.

`@anticapture/client#codegen` is also no longer cached by turbo: its real input
is a live URL no hash can see, so the poisoned output above was replayed on
every retry of that commit and no re-run could ever fix it.
