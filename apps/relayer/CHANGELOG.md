# @anticapture/relayer

## 1.2.1

### Patch Changes

- Updated dependencies [[`2822cdd`](https://github.com/blockful/anticapture/commit/2822cdde3f30604b78c53dc525d9fb925eb68997)]:
  - @anticapture/client@2.1.1

## 1.2.0

### Minor Changes

- [#2122](https://github.com/blockful/anticapture/pull/2122) [`75f1051`](https://github.com/blockful/anticapture/commit/75f10514459d9b4b75b781ec016e66220597e70e) Thanks [@LeonardoVieira1630](https://github.com/LeonardoVieira1630)! - Add POST /relay/queue and /relay/execute endpoints that sponsor the
  permissionless Governor lifecycle transactions. Proposal args are fetched from
  the Anticapture API by proposal id and verified trustlessly against the
  governor's hashProposal before anything is signed.

### Patch Changes

- [#2140](https://github.com/blockful/anticapture/pull/2140) [`580eb0a`](https://github.com/blockful/anticapture/commit/580eb0af6bd8b8ddbf88b1d509070d43f90af7ca) Thanks [@brunod-e](https://github.com/brunod-e)! - Keep queue/execute requests deduplicated while a broadcast transaction is still pending after a receipt timeout.

- [#2142](https://github.com/blockful/anticapture/pull/2142) [`75d0b4e`](https://github.com/blockful/anticapture/commit/75d0b4e5c3f0260631d31b3872a25126d64d4a95) Thanks [@brunod-e](https://github.com/brunod-e)! - Keep the enactment lock held when the post-broadcast receipt wait fails with an RPC error.

- Updated dependencies [[`b02461b`](https://github.com/blockful/anticapture/commit/b02461b64ae44f0fadc2b497ec2363c13d00bf4a)]:
  - @anticapture/client@2.1.0

## 1.1.2

### Patch Changes

- [#2098](https://github.com/blockful/anticapture/pull/2098) [`002b33c`](https://github.com/blockful/anticapture/commit/002b33ca39cd7e2aaa5373732fe02aa09a25dd93) Thanks [@pikonha](https://github.com/pikonha)! - Stop the production dashboard build from generating its SDK against the
  previous release's OpenAPI spec.

  Gateful merges the DAO APIs' specs into `/docs/json` on every request, so the
  deploy gate waiting for gateful's own commit proved nothing about the schemas
  it would serve: on [#2093](https://github.com/blockful/anticapture/issues/2093) gateful reported the new commit at 14:33:54, codegen
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
  every retry of that commit and no re-run could ever fix it. `#build` had to go
  with it: tsup runs with `dts: true`, so that same unhashable spec is compiled
  into `dist`, and a retry that re-ran codegen would restore the stale `dist`
  straight over the freshly generated output. Declaring `generated/**` as an
  input does not close this — turbo hashes inputs before the run, and the
  directory is gitignored, so on a fresh checkout it is still empty at the moment
  the hash is taken.

## 1.1.1

### Patch Changes

- [#2055](https://github.com/blockful/anticapture/pull/2055) [`248a451`](https://github.com/blockful/anticapture/commit/248a4518fd7d22c24ceaa23ad4692e1a5cb18aa6) Thanks [@pikonha](https://github.com/pikonha)! - Make request log messages human-readable in Loki (`GET /path 200` instead of `request`) and stop logging `/metrics` and `/health` scrapes

## 1.1.0

### Minor Changes

- [#1976](https://github.com/blockful/anticapture/pull/1976) [`4e5f06a`](https://github.com/blockful/anticapture/commit/4e5f06a261211b9a94eb0e40047468000ba40363) Thanks [@LeonardoVieira1630](https://github.com/LeonardoVieira1630)! - Switch relayer rate limiting from a shared daily window to per-operation monthly limits (separate caps for votes and delegations), configurable via `MAX_VOTES_PER_ADDRESS_PER_MONTH` and `MAX_DELEGATIONS_PER_ADDRESS_PER_MONTH` (each defaulting to 3). The `/relay/config` and `/relay/rate-limit/{address}` responses now expose per-operation `limits`/`limit` and a monthly `resetsAt`; the client SDK is regenerated to match. The dashboard `useGaslessRelayer` hook now exposes `voteLimit`/`delegationLimit` in place of the removed `maxRelayPerAddressPerDay`/`maxPerDay` fields.
