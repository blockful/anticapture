---
"@anticapture/api": patch
"@anticapture/hypersync-indexer": patch
---

Fix hypersync-indexer codegen on fresh clones and clean up API merge residue
that was breaking typecheck.

- `@anticapture/hypersync-indexer`: add a `postinstall` script that runs
  `pnpm -C generated install --ignore-workspace` so the `generated/`
  package's ReScript build dependencies (`rescript-envsafe`,
  `@rescript/react`, etc.) get installed. The root workspace install
  doesn't reach the nested `generated/package.json`, so without this
  hook `envio codegen` fails with `package rescript-envsafe not found
or built` on any fresh clone or CI runner.
- `@anticapture/api`: restore missing Drizzle imports (`primaryKey`,
  `pgEnum`) in `database/schema.ts`, rename the relation key from
  `row.VotingPowerHistory` to `row.voting_power_history` in the
  voting-power repositories (matches the renamed table), and update
  feed tests to use `FeedEventType` enum members instead of bare
  string literals plus add missing `id` fields on `votingPowerHistory`,
  `delegation`, `transfer`, and `votesOnchain` inserts.
