# Relayer Persistent Rate Limiter — Design

**Date:** 2026-04-16
**Status:** Design approved, pending implementation plan
**Scope:** `apps/relayer`, `apps/offchain-indexer`

## Problem

The relayer's `RateLimiter` (`apps/relayer/src/services/guards/rate-limiter.ts`) stores per-address request timestamps in an in-memory `Map<Address, number[]>`. Every process restart (deploy, crash, instance replacement) wipes the state, effectively resetting every user's rate-limit counters. This defeats the purpose of the limiter, which is the relayer's only per-address abuse guard.

The limiter must persist across restarts. Since the relayer is deployed per-DAO and Anticapture already runs a shared Postgres accessed by the indexer and API, the natural store is the same database.

A known concern: the shared DB has a `snapshot` schema (owned by `offchain-indexer`) that can be wiped by `FORCE_BACKFILL`. This design must not place rate-limit data anywhere that could be wiped by routine operations.

## Goals

- Rate-limit state survives relayer restarts.
- No change to the 5/hour and 50/day per-address policy currently enforced.
- No change to the shared-instance behavior across `/relay/vote` and `/relay/delegate` (combined limit).
- Fail-closed on database errors — an unreachable DB must not give an attacker unlimited relays.
- Minimize new infrastructure: reuse the existing Postgres, existing Drizzle tooling, existing schema/migration conventions.

## Non-goals

- Multi-DAO support inside a single relayer process. Each relayer deployment serves one DAO, matching current deployment shape.
- Governance policy enforcement (cooldowns, per-proposal limits, etc.). That belongs on-chain, per the relayer scope.
- Distributed-relayer coordination (leader election, locks, etc.). Single instance is assumed; the design does not preclude multiple instances later, but correctness guarantees beyond a single instance are out of scope.
- Retroactive migration of in-memory state. Existing counters are ephemeral and are discarded on deploy.

## Backfill safety verification

`FORCE_BACKFILL` in `apps/offchain-indexer/src/indexer.ts` (lines 18–27) executes:

```
DELETE FROM snapshot.proposals
DELETE FROM snapshot.votes
DELETE FROM snapshot.sync_status WHERE entity = 'proposals'
DELETE FROM snapshot.sync_status WHERE entity = 'votes'
```

The schema is not dropped; only the three known tables (and two known `sync_status` rows) are deleted. A new table added to `snapshot` is not affected by backfill and will persist across backfill cycles.

## Key decisions

| #   | Decision                                                                                       | Rationale                                                                                                                                                                                                               |
| --- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Rate-limit table lives in the existing `snapshot` schema.                                      | Reuses the offchain-indexer's migration pipeline and Drizzle setup. Safe from `FORCE_BACKFILL`, which targets only `proposals`, `votes`, and specific `sync_status` rows.                                               |
| 2   | One row per relay request.                                                                     | Preserves the true sliding-window semantics of the current in-memory implementation; current tests continue to apply. Row volume is trivial (≤50/day/address).                                                          |
| 3   | Single-DAO per relayer instance — no `dao_id` column.                                          | Matches current deployment model (one relayer = one DAO = one DB).                                                                                                                                                      |
| 4   | Migrations owned by `offchain-indexer`.                                                        | Single migrator of the `snapshot` schema, preventing dual-source conflicts. Relayer keeps a read/write schema definition locally for Drizzle typing but never migrates.                                                 |
| 5   | Rate-limit is combined across operations. `operation` column is stored for observability only. | Matches current behavior where the same limiter is shared between `/relay/vote` and `/relay/delegate`. Existing tests remain valid.                                                                                     |
| 6   | No cleanup job. Table grows unbounded.                                                         | With a composite `(address, created_at)` index, query cost is independent of total row count. Simplicity wins at the current scale (abuse protection for a single DAO).                                                 |
| 7   | Fail-closed on database errors.                                                                | The limiter is the only per-address abuse guard; fail-open would hand an attacker unlimited relays during a DB outage.                                                                                                  |
| 8   | Record-before-submit, never revert on tx failure.                                              | Closes the check-vs-record race that exists today. Spending a slot on every valid attempt (not just successful submissions) denies attackers the ability to recover budget by deliberately causing submission failures. |
| 9   | `checkAllowed` and `recordUsage` collapse into a single atomic operation `reserveSlot`.        | Follows from decision 8. Single conditional `INSERT` with subquery counts means one DB roundtrip per relay and no race window between the count and the insert.                                                         |

## Schema

Namespace: `snapshot` (existing, owned by `offchain-indexer`).

Table:

```sql
CREATE TABLE snapshot.relay_usage (
  id          bigserial   PRIMARY KEY,
  address     text        NOT NULL,
  operation   text        NOT NULL,   -- 'vote' | 'delegation'
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX relay_usage_address_created_at_idx
  ON snapshot.relay_usage (address, created_at DESC);
```

### Column notes

- `address text` — stored as the normalized checksum address (viem `getAddress`) at write time, matching the current in-memory key format.
- `operation text` — not a Postgres enum. Text plus a Zod validator at the repository layer avoids migrations if a future relay operation is introduced.
- `created_at timestamptz DEFAULT now()` — time is authoritative from the database, not the Node process. All window math uses `now() - interval 'N hours'`, eliminating client-clock drift as a failure mode.
- `id bigserial` — audit-friendly and stable for future ordered queries (e.g., forensics views).

### Index rationale

`(address, created_at DESC)` directly supports every query pattern the limiter uses: `WHERE address = ? AND created_at > now() - interval 'N hours'`. Query cost stays constant-time regardless of total table size, which is what makes "no cleanup" a viable choice.

### Schema-file duplication

The repo already tolerates the same `snapshot` schema being defined in two places (`apps/offchain-indexer/src/repository/schema.ts` as the migrator's source of truth, and `apps/api/src/database/offchain-schema.ts` as a read-only copy). A third copy will be added in the relayer for the `relay_usage` table only:

- `apps/offchain-indexer/src/repository/schema.ts` — add `relayUsage` definition. Drives the migration.
- `apps/relayer/src/repository/schema.ts` — new file. Mirrors only the `relay_usage` table for Drizzle typing. Never used for migration.

## Request flow

```
POST /relay/vote ─┐
                   ├─> parse + validate (signature, MIN_VOTING_POWER, etc.)
POST /relay/delegate ┘      │
                            v
                    reserveSlot(address, operation)
                            │
                    ├── over limit:  throw RATE_LIMITED  → HTTP 429
                    └── db error:    throw DATABASE_UNAVAILABLE → HTTP 503
                            │
                    submitTransaction()
                            │
                    (any submission failure propagates as today; slot stays spent)
                            │
                    respond 200
```

Ordering:

1. **Validation first.** Invalid signatures and sub-threshold voting power are rejected without touching the rate-limit table. Bad input never spends a slot.
2. **Reserve slot.** A single conditional `INSERT` atomically enforces the 5/hour and 50/day checks. Either the row is inserted (slot granted) or it is not (rate-limited).
3. **Submit transaction.** Any failure after this point — RPC errors, on-chain reverts, etc. — leaves the row in place. The slot is spent.

This ordering deliberately makes the slot cost "pay-on-attempt" rather than "pay-on-success." The tradeoff is accepted because the limiter's job is abuse protection, not user-friendliness; letting a caller recover budget by forcing submission failures defeats its purpose.

## Components

### New: `apps/relayer/src/repository/`

- `schema.ts` — Drizzle table definition for `snapshot.relay_usage` (typing only; relayer never migrates).
- `db.ts` — `createDb(url: string)` returning a configured Drizzle client (`pg` pool + snake_case casing), mirroring `offchain-indexer`'s setup.
- `relay-usage.ts` — data-access functions. Specifically:
  - `reserveSlot(db, { address, operation, maxPerHour, maxPerDay })` — runs the atomic conditional `INSERT`. Returns a boolean: `true` if slot granted, `false` if over limit. Throws on DB errors.

Reference shape for the atomic conditional `INSERT`:

```sql
INSERT INTO snapshot.relay_usage (address, operation)
SELECT $1, $2
WHERE (SELECT count(*) FROM snapshot.relay_usage
       WHERE address = $1 AND created_at > now() - interval '1 hour') < $3
  AND (SELECT count(*) FROM snapshot.relay_usage
       WHERE address = $1 AND created_at > now() - interval '24 hours') < $4
RETURNING id;
```

Zero rows returned → over limit (`reserveSlot` returns `false`). One row returned → slot granted (`reserveSlot` returns `true`).

The repository layer is pure data access: no policy, no error semantics, no config state. This boundary lets the repository be tested against pglite while the rate-limiter service can be unit-tested against a mocked repository if desired.

### Modified: `apps/relayer/src/services/guards/rate-limiter.ts`

The interface collapses to a single method:

```ts
export type RelayOperation = "vote" | "delegation";

export interface IRateLimiter {
  reserveSlot(address: Address, operation: RelayOperation): Promise<void>;
}
```

Implementation holds the Drizzle client and the `{ maxPerHour, maxPerDay }` configuration. On each call it invokes `reserveSlot` from the repository. On `false` (over limit) it throws `RATE_LIMITED`. On DB errors it throws `DATABASE_UNAVAILABLE`.

The previous public methods `checkAllowed` and `recordUsage` are removed. The `reset()` testing hook is removed from the interface and replaced by a test helper (`truncateRelayUsage`) that `TRUNCATE`s the table in tests.

### Modified: `apps/relayer/src/services/relay.ts`

- `relayVote()` replaces its `checkAllowed(addr)` + `recordUsage(addr)` pair with a single `await this.rateLimiter.reserveSlot(addr, "vote")` call, placed after validation and before tx submission.
- `relayDelegation()` likewise uses `reserveSlot(addr, "delegation")` in the same position.

No control-flow changes beyond the ordering (slot reservation moves before tx submission) and the string argument for operation.

### Modified: `apps/relayer/src/index.ts`

Wire the Drizzle client into the `RateLimiter` constructor:

```ts
const db = createDb(env.DATABASE_URL);
const rateLimiter = new RateLimiter(db, {
  maxPerAddressPerDay: env.MAX_RELAY_PER_ADDRESS_PER_DAY,
  maxPerAddressPerHour: env.MAX_RELAY_PER_ADDRESS_PER_HOUR,
});
```

### Modified: `apps/relayer/src/env.ts`

Add required env var `DATABASE_URL` (Zod-validated URL string).

### Modified: `apps/relayer/package.json`

Add runtime deps `drizzle-orm`, `pg`, and dev dep `@types/pg`. Do **not** add `drizzle-kit` — the relayer does not migrate.

### Modified: `apps/offchain-indexer/src/repository/schema.ts`

Add the `relayUsage` table definition.

### Modified: `apps/offchain-indexer/drizzle/`

New migration file (next sequence number) creating `snapshot.relay_usage` and its index. Applied automatically by the indexer's existing startup migration call.

## Error handling

Only one new error mode on top of today's:

- `DATABASE_UNAVAILABLE` — raised by the repository layer on connection or query failure; mapped to HTTP 503 by the relayer's existing error middleware.

Existing error modes (`RATE_LIMITED`, signature validation errors, etc.) are preserved unchanged.

## Testing

Mirrors the `offchain-indexer` pattern using `@electric-sql/pglite` for in-process Postgres.

- `apps/relayer/src/repository/relay-usage.test.ts` — exercises `reserveSlot` against pglite:
  - basic grant + record,
  - hourly limit boundary (5th allowed, 6th rejected),
  - daily limit boundary (50th allowed, 51st rejected),
  - window expiry (old rows don't count),
  - address isolation,
  - operation coexistence (vote and delegation both count against the combined limit).
- `apps/relayer/src/services/guards/rate-limiter.test.ts` — adapted from the existing tests to the new single-method API. Preserves all sliding-window assertions. These tests use the same pglite-backed repository as the repository tests (no mock), so the service's error-mapping (`RATE_LIMITED` vs `DATABASE_UNAVAILABLE`) is exercised against real SQL behavior.

Time control in tests uses explicit `created_at` values on inserted rows to simulate history (the `now()` default is overridable per-insert).

No real Postgres is required for test runs.

## Rollout

1. Merge the offchain-indexer migration creating `snapshot.relay_usage`. Deploy — the table now exists in all environments.
2. Deploy the relayer with `DATABASE_URL` set and the new rate-limiter wired in.

No feature flag, no dual-write period, no data migration. The previous in-memory counters are discarded — their lifetime was already a single process, so there is no loss beyond a restart's worth of state (which already happens on every deploy today).

Rollback is a plain relayer revert; the table is safe to leave in place.

### Startup-order coupling

The relayer fails to start (explicit error) if `snapshot.relay_usage` does not exist, rather than silently creating it. This coupling (relayer depends on indexer's migrations having been applied) is invisible in production — the offchain-indexer runs once per environment and the table is created before the relayer sees traffic — but needs documenting for local development and CI.

## Documentation updates

- `apps/relayer/README.md` — new `DATABASE_URL` env var, dependency on `snapshot.relay_usage`.
- Top-level `CLAUDE.md` — note that the relayer now reads/writes the shared DB (the architecture diagram currently shows it with no DB arrow).

## Open questions

None blocking implementation. The design is complete pending plan-writing.
