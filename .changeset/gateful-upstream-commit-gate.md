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

The DAO API now reports its running commit on `/health`, gateful passes it
through as `upstreams.<dao>.commit`, and `scripts/wait-for-gateful.mjs` waits
for every upstream that reports one when `REQUIRE_UPSTREAM_COMMIT=1` — set by
the deploy workflow only when the release touches the paths Railway watches to
rebuild those APIs, so releases that leave them alone are not blocked.

`@anticapture/client#codegen` is also no longer cached by turbo: its real input
is a live URL no hash can see, so the poisoned output above was replayed on
every retry of that commit and no re-run could ever fix it.
