# Relayer monthly per-operation rate limits — Design

**Date:** 2026-06-15
**Status:** Approved (pending spec review)
**Scope:** `@anticapture/relayer` contract change with full downstream ripple into `@anticapture/gateful`, `@anticapture/client`, and `@anticapture/dashboard`.

## Problem

The relayer rate-limits relays per address with a **daily** fixed window (UTC day bucket in Redis, 24h TTL), controlled by a single env var `MAX_RELAY_PER_ADDRESS_PER_DAY` (default 3). Votes and delegations share that one limit.

We want:

1. The window to reset **monthly** instead of daily.
2. **Separate limits per operation** — votes and delegations each get their own limit.
3. A single in-code default constant (`DEFAULT_RELAY_LIMIT = 3`) used as the fallback when an operation's env var is unset.
4. Granular optional env vars: `MAX_VOTES_PER_ADDRESS_PER_MONTH`, `MAX_DELEGATIONS_PER_ADDRESS_PER_MONTH`.

## Decisions

| Decision       | Choice                  | Rationale                                                                                                                                                                                                                                                                                                                                                            |
| -------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scope          | **Full ripple**         | The rate-limit/config responses are a published contract (relayer → gateful → `@anticapture/client` → dashboard `useGaslessRelayer.ts`). Once vote and delegation have different limits, a single `maxPerDay`/`maxRelayPerAddressPerDay` field is meaningless, so the response shape must change and that change must propagate, or the dashboard breaks at runtime. |
| Window type    | **Calendar month, UTC** | Bucket keyed by `YYYY-MM` (UTC). Counter resets at 00:00 UTC on the 1st. Mirrors today's calendar-aligned UTC-day design exactly; `resetsAt` = next month boundary; intuitive reset dates.                                                                                                                                                                           |
| Response shape | **Nested**              | Limit travels with its usage block in the rate-limit response; config groups limits in one object. Self-describing and compact.                                                                                                                                                                                                                                      |

## Codegen pipeline (context)

```
relayer /docs (zod-openapi spec)
   └─> gateful fetches /docs at runtime → merges RelayerConfigResponse /
       RelayerRateLimitResponse into apps/gateful/openapi/gateful.json (committed)
          └─> kubb (pnpm client codegen) → @anticapture/client/generated/*
                 └─> dashboard apps/dashboard/shared/hooks/useGaslessRelayer.ts
```

`apps/gateful/src/upstream-docs.ts` fetches one reachable relayer `/docs` (all DAO relayers share one contract) and merges its `/config`, `/rate-limit/*`, `/relay/*` paths and `components.schemas` into the gateway spec.

## Target API shapes

### `GET /{dao}/config`

```jsonc
{
  "minVotingPower": "1000000000000000000000",
  "limits": { "vote": 3, "delegation": 3 },
}
```

### `GET /{dao}/rate-limit/{address}`

```jsonc
{
  "address": "0x…",
  "vote": { "used": 0, "remaining": 3, "limit": 3 },
  "delegation": { "used": 0, "remaining": 3, "limit": 3 },
  "resetsAt": "2026-07-01T00:00:00.000Z", // next UTC month start
}
```

The top-level `maxPerDay` / `maxRelayPerAddressPerDay` fields are removed.

## Component changes

### A. Storage — `apps/relayer/src/repository/rate-limit-storage.ts`

- `dailyKey(base, ts)` → `monthlyKey(base, ts)`, producing suffix `:m:YYYY-MM` from UTC year/month (`new Date(ts).getUTCFullYear()`, `getUTCMonth()`, month zero-padded to 2 digits).
- Replace the fixed `DAY_SECONDS = 86400` TTL with a `secondsUntilNextUtcMonth(ts)` helper:
  `Math.ceil((Date.UTC(year, month + 1, 1) - ts) / 1000)`. Set this TTL on the first increment (`count === 1`) so the key self-expires exactly at the month boundary.
- Rename `IncrementIfAllowedParams.maxPerDay` → `maxPerMonth`; comparison becomes `count <= maxPerMonth`.
- `getCount` switches to `monthlyKey`.
- Remove the now-unused `DAY_MS` / `DAY_SECONDS` constants; keep whatever the new helpers need.

### B. Limit resolution + default — `apps/relayer/src/services/guards/rate-limiter.ts`

- `export const DEFAULT_RELAY_LIMIT = 3;`
- `export function resolveRelayLimits(input: { votes?: number; delegations?: number }): Record<RelayOperation, number>` returning `{ vote: input.votes ?? DEFAULT_RELAY_LIMIT, delegation: input.delegations ?? DEFAULT_RELAY_LIMIT }`. This is the single pure, testable home for the fallback logic.
- `RateLimiterConfig.maxPerAddressPerDay: number` → `limits: Record<RelayOperation, number>`.
- `assertWithinLimit` passes `maxPerMonth: this.config.limits[operation]` to the store.

### C. Env — `apps/relayer/src/env.ts`

Remove `MAX_RELAY_PER_ADDRESS_PER_DAY`. Add:

```ts
MAX_VOTES_PER_ADDRESS_PER_MONTH: z.coerce.number().int().positive().optional(),
MAX_DELEGATIONS_PER_ADDRESS_PER_MONTH: z.coerce.number().int().positive().optional(),
```

No zod `.default(...)` — leaving them `undefined` when unset lets `resolveRelayLimits` apply the in-code `DEFAULT_RELAY_LIMIT`, keeping the default in exactly one place.

`.positive()` (≥ 1) is deliberate: a `0` or negative limit is treated as misconfiguration and rejected at startup rather than silently disabling an operation. (The old `MAX_RELAY_PER_ADDRESS_PER_DAY` used a bare `.int()` that permitted `0`/negatives.)

### D. Wiring + logs — `apps/relayer/src/index.ts`

- Build once:
  ```ts
  const relayLimits = resolveRelayLimits({
    votes: env.MAX_VOTES_PER_ADDRESS_PER_MONTH,
    delegations: env.MAX_DELEGATIONS_PER_ADDRESS_PER_MONTH,
  });
  ```
- Pass the same `relayLimits` object to `RateLimiter` (`limits: relayLimits`), the `config` controller, and the `rateLimit` controller.
- Add `voteLimitPerMonth: relayLimits.vote` and `delegationLimitPerMonth: relayLimits.delegation` to the "Relayer starting" log object.

### E. Contract — controllers + schemas

`apps/relayer/src/controllers/config.ts` + `apps/relayer/src/schemas/config.ts`:

- Deps `maxRelayPerAddressPerDay: number` → `limits: { vote: number; delegation: number }`.
- `ConfigResponseSchema`: replace `maxRelayPerAddressPerDay` with `limits: z.object({ vote: z.number().int().min(0), delegation: z.number().int().min(0) })`; update descriptions.

`apps/relayer/src/controllers/rate-limit.ts` + `apps/relayer/src/schemas/rate-limit.ts`:

- Deps `maxPerDay: number` → `limits: { vote: number; delegation: number }`.
- `OperationUsageSchema` gains `limit: z.number().int().min(0)`.
- `RateLimitResponseSchema`: remove top-level `maxPerDay`; `resetsAt` description → "next UTC month start".
- Controller: drop `maxPerDay`; per operation emit `{ used, remaining: clampRemaining(used, limits[op]), limit: limits[op] }`.
- Replace `nextUtcMidnightIso(now)` with `nextUtcMonthStartIso(now)` → `new Date(Date.UTC(y, month + 1, 1)).toISOString()`.
- Update route `summary`/`description` (day → month, per-operation).

### F. Downstream regen + consumers

1. Regenerate `apps/gateful/openapi/gateful.json` by running the relayer + gateful locally so gateful re-fetches `/docs` and re-merges the updated `RelayerConfigResponse` / `RelayerRateLimitResponse`. (Fallback if local run is impractical: targeted hand-edit of just those two schemas + the `limit` field in `gateful.json`; regenerating from source is preferred. Exact invocation to be confirmed in the plan.)
2. `pnpm client codegen` → regenerates `@anticapture/client/generated/*` (models, zod, hooks, faker, msw, mcp).
3. `apps/dashboard/shared/hooks/useGaslessRelayer.ts`:
   - `UseRelayerConfigResult`: `maxRelayPerAddressPerDay: number | null` → `voteLimit` / `delegationLimit` (from `data.limits.vote` / `data.limits.delegation`).
   - `UseRelayerRateLimitResult`: `maxPerDay: number | null` → per-operation limits from `data.vote.limit` / `data.delegation.limit`.
   - Repo-wide grep shows no UI component reads `maxRelayPerAddressPerDay` or `maxPerDay`; change is expected to be contained to the hook + its interfaces. Confirm during implementation.

### G. Tests

`apps/relayer/src/repository/rate-limit-storage.test.ts`:

- `dailyKey` → `monthlyKey`; `MAX_PER_DAY` → `MAX_PER_MONTH`; param `maxPerDay` → `maxPerMonth`.
- The "outside the window" tests seed a **previous-month** bucket via a timestamp like `Date.UTC(d.getUTCFullYear(), d.getUTCMonth() - 1, 15)` (robust across year rollover) instead of "25 hours ago".
- Keep the per-address isolation and independent vote/delegation coverage.

`apps/relayer/src/services/guards/rate-limiter.test.ts`:

- Config now uses `limits`; fake store param `maxPerDay` → `maxPerMonth`.
- Add a test asserting **different** vote vs delegation limits are enforced independently (e.g. vote 2, delegation 5).

New coverage for `resolveRelayLimits` (acceptance matrix):

- Neither env var set → `{ vote: 3, delegation: 3 }`.
- Only votes set → votes uses it, delegation = 3.
- Only delegations set → delegation uses it, votes = 3.
- Both set → each uses its own.

### H. Docs + changeset

- `.env.example`: replace the `MAX_RELAY_PER_ADDRESS_PER_DAY=3` block with the two new optional vars (commented out, noting "optional; per address, per calendar month, UTC; default 3 each when unset").
- **`.env` is NOT modified** (boundary rule: never modify `.env` files).
- Changesets:
  - `@anticapture/relayer` — behavior + contract change.
  - `@anticapture/gateful` — contract change (`api-contract-updates.yaml` enforces this when the merged spec changes).
  - `@anticapture/client` — regenerated, published package.
  - `@anticapture/dashboard` — hook change.
  - (Bump types decided at PR time; for 0.x packages a behavior/contract change is `minor`, breaking is `major`.)

## Acceptance criteria

- Counter resets monthly (calendar month, UTC), not daily.
- No env vars set → both votes and delegations limited to 3/month.
- Only one env var set → that operation uses it; the other uses the default 3.
- Both set → each operation uses its own limit.
- Tests updated and passing; `pnpm relayer typecheck` + `pnpm relayer lint` clean.
- Dashboard + client compile against the new contract.
- Changesets included.

## Manual verification

1. **Defaults:** start relayer with no rate-limit env vars; `GET /relay/config` returns `limits: { vote: 3, delegation: 3 }`.
2. **Granular override:** set only `MAX_VOTES_PER_ADDRESS_PER_MONTH=10`; config shows `vote: 10, delegation: 3`.
3. **Monthly enforcement:** exhaust an operation's limit; the next relay returns `RATE_LIMITED`; `GET /relay/rate-limit/{address}` shows `remaining: 0` and `resetsAt` at the next UTC month start.
4. **Independent operations:** exhausting votes does not block delegations.
5. **Dashboard:** gasless eligibility hints still render against the regenerated client.

## Out of scope

- No backward-compatibility shim for the old `maxPerDay` / `maxRelayPerAddressPerDay` fields (full ripple chosen).
- No change to the `RATE_LIMITED` / `RATE_LIMITER_UNAVAILABLE` error behavior.
- No change to `MIN_VOTING_POWER` or relayer balance logic.
