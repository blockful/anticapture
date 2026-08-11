# @anticapture/address-enrichment

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

- [#2053](https://github.com/blockful/anticapture/pull/2053) [`633b628`](https://github.com/blockful/anticapture/commit/633b6287869693b8c707677d7b0af62a4b2c6ad7) Thanks [@pikonha](https://github.com/pikonha)! - add pg pool config to avoid hanging db connections

## 1.1.0

### Minor Changes

- [#1993](https://github.com/blockful/anticapture/pull/1993) [`add9bd1`](https://github.com/blockful/anticapture/commit/add9bd1e96ea89dd26f892fcd30353919d905126) Thanks [@caveman-eth](https://github.com/caveman-eth)! - Surface ENS social records and EFP stats for addresses.
  - `address-enrichment` now reads the EFP `/details` endpoint, capturing the ENS `com.twitter`, `org.telegram`, `email`, and `com.github` text records plus EFP follower/following counts. These are exposed under `ens` (socials) and a new `efp` object, cached under the existing ENS TTL. EFP counts are returned even when the address has no primary ENS name.
  - The Holders & Delegates drawer header now shows follower/following counts (linked to the EFP profile) and social links (X, Telegram, GitHub, email) for the selected address.

### Patch Changes

- [#2010](https://github.com/blockful/anticapture/pull/2010) [`325fccb`](https://github.com/blockful/anticapture/commit/325fccbed3d6693be643127c0ef71fb90cf1e0bd) Thanks [@pikonha](https://github.com/pikonha)! - Add committed Drizzle migrations and apply them at startup.
