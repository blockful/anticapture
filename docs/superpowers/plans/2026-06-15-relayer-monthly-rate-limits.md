# Relayer Monthly Per-Operation Rate Limits — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Switch the relayer rate limiter from a shared daily window to a calendar-month (UTC) window with separate, independently-configurable limits for votes and delegations, and propagate the resulting contract change through Gateful, the client SDK, and the dashboard.

**Architecture:** A pure `resolveRelayLimits()` applies an in-code `DEFAULT_RELAY_LIMIT = 3` to any operation whose env override is unset. The Redis store buckets counts by `YYYY-MM` (UTC) with a TTL that expires the key at the next month boundary. The `RateLimiter` holds a per-operation `limits` map; the `/relay/config` and `/relay/rate-limit/{address}` responses expose those limits per operation. Downstream, `gateful.json` is updated to match, the kubb client is regenerated, and the dashboard hook reads the new fields.

**Tech Stack:** TypeScript, Hono + `@hono/zod-openapi`, Zod, Redis, Vitest, Kubb, TanStack Query, pnpm + Turborepo.

**Spec:** `docs/superpowers/specs/2026-06-15-relayer-monthly-rate-limits-design.md`

**Branch:** `feat/relayer-monthly-rate-limits` (already created off `main`; spec already committed).

---

## File map

| File                                                     | Change                                                                             |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `apps/relayer/src/repository/rate-limit-storage.ts`      | `dailyKey`→`monthlyKey`, add `secondsUntilNextUtcMonth`, `maxPerDay`→`maxPerMonth` |
| `apps/relayer/src/repository/rate-limit-storage.test.ts` | Monthly buckets, prev-month seeding, `maxPerMonth`                                 |
| `apps/relayer/src/services/guards/rate-limiter.ts`       | `DEFAULT_RELAY_LIMIT`, `resolveRelayLimits`, config `limits`                       |
| `apps/relayer/src/services/guards/rate-limiter.test.ts`  | `limits` config, per-op test, `resolveRelayLimits` matrix                          |
| `apps/relayer/src/env.ts`                                | Remove `MAX_RELAY_PER_ADDRESS_PER_DAY`; add two optional monthly vars              |
| `apps/relayer/src/schemas/config.ts`                     | `maxRelayPerAddressPerDay`→`limits` object                                         |
| `apps/relayer/src/controllers/config.ts`                 | Deps + response use `limits`                                                       |
| `apps/relayer/src/schemas/rate-limit.ts`                 | Add `limit` per op; drop top-level `maxPerDay`; monthly `resetsAt`                 |
| `apps/relayer/src/controllers/rate-limit.ts`             | Per-op `limit`, `nextUtcMonthStartIso`, deps `limits`                              |
| `apps/relayer/src/index.ts`                              | Build `relayLimits`, wire to limiter + both controllers, startup log               |
| `apps/relayer/e2e/helpers/app.ts`                        | `RateLimiter` config `maxPerAddressPerDay`→`limits`                                |
| `apps/relayer/.env.example`                              | New optional monthly vars                                                          |
| `apps/gateful/openapi/gateful.json`                      | Update `RelayerConfigResponse` + `RelayerRateLimitResponse`                        |
| `packages/anticapture-client/generated/*`                | Regenerated via `pnpm client codegen`                                              |
| `apps/dashboard/shared/hooks/useGaslessRelayer.ts`       | Read `limits` / per-op `limit`                                                     |
| `.changeset/relayer-monthly-per-operation-limits.md`     | New changeset (relayer + gateful + client)                                         |

**Commands reference** (run from repo root):

- Single relayer test file: `pnpm --filter=@anticapture/relayer exec vitest run <path>`
- All relayer unit tests: `pnpm relayer test`
- Relayer typecheck / lint: `pnpm relayer typecheck` · `pnpm relayer lint`
- Client codegen / typecheck / lint: `pnpm client codegen` · `pnpm client typecheck` · `pnpm client lint`
- Dashboard typecheck: `pnpm dashboard typecheck`
- Whole monorepo: `pnpm typecheck` · `pnpm lint`

> **Note on commits:** A `lint-staged` hook runs Prettier + ESLint `--fix` on staged files at commit time, so minor formatting is auto-corrected. Each task below still runs `typecheck`/`lint`/`test` _before_ committing so every commit is green. End every commit message body with:
> `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`

---

## Task 1: Storage — monthly calendar window

Switch the Redis bucket from a UTC-day to a UTC calendar-month, expiring at the month boundary, and rename the limit param. The param rename forces touching the one call site in `rate-limiter.ts` and the fake stores in both test files so the package stays green.

**Files:**

- Modify: `apps/relayer/src/repository/rate-limit-storage.ts`
- Modify: `apps/relayer/src/repository/rate-limit-storage.test.ts`
- Modify: `apps/relayer/src/services/guards/rate-limiter.ts:33-39` (call site only)
- Modify: `apps/relayer/src/services/guards/rate-limiter.test.ts:18-31` (fake store param)

- [ ] **Step 1: Rewrite the storage test for monthly buckets**

Replace the entire contents of `apps/relayer/src/repository/rate-limit-storage.test.ts` with:

```ts
import { describe, it, expect, beforeEach } from "vitest";
import { getAddress } from "viem";

import {
  RedisRateLimitStorage,
  buildKey,
  monthlyKey,
  type RedisClient,
} from "./rate-limit-storage";

const MAX_PER_MONTH = 3;

/**
 * In-memory counter store for fixed-window rate limiting tests.
 * TTLs are ignored — tests do not simulate time passing beyond what bucket keys encode.
 */
class FakeRedis implements RedisClient {
  private counters = new Map<string, number>();

  async incr(key: string): Promise<number> {
    const next = (this.counters.get(key) ?? 0) + 1;
    this.counters.set(key, next);
    return next;
  }

  async expire(_key: string, _seconds: number): Promise<number> {
    return 1;
  }

  async get(key: string): Promise<string | null> {
    const value = this.counters.get(key);
    return value === undefined ? null : String(value);
  }

  seed(key: string, delta: number): void {
    this.counters.set(key, (this.counters.get(key) ?? 0) + delta);
  }
}

const DAO = "ens";
const GOVERNOR = getAddress("0x323A76393544d5ecca80cd6ef2A560C6a395b7E3");
const ADDR_A = getAddress("0x3333333333333333333333333333333333333333");
const ADDR_B = getAddress("0x4444444444444444444444444444444444444444");

let redis: FakeRedis;
let store: RedisRateLimitStorage;

/** Seeds a single usage entry into the bucket for the given timestamp (defaults to now). */
function insertUsage(
  address: ReturnType<typeof getAddress>,
  operation: "vote" | "delegation",
  timestampMs: number = Date.now(),
): void {
  const base = buildKey(DAO, GOVERNOR, address, operation);
  redis.seed(monthlyKey(base, timestampMs), 1);
}

/** A timestamp guaranteed to fall in a previous calendar month (handles year rollover). */
function previousMonthTs(): number {
  const now = new Date(Date.now());
  return Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 15);
}

beforeEach(() => {
  redis = new FakeRedis();
  store = new RedisRateLimitStorage(redis);
});

describe("RedisRateLimitStorage.incrementIfAllowed", () => {
  it("grants first slot", async () => {
    const granted = await store.incrementIfAllowed({
      daoName: DAO,
      governorAddress: GOVERNOR,
      address: ADDR_A,
      operation: "vote",
      maxPerMonth: MAX_PER_MONTH,
    });

    expect(granted).toBe(true);
  });

  it("allows up to the monthly limit and rejects the next request", async () => {
    for (let i = 0; i < MAX_PER_MONTH - 1; i++) insertUsage(ADDR_A, "vote");

    const atLimit = await store.incrementIfAllowed({
      daoName: DAO,
      governorAddress: GOVERNOR,
      address: ADDR_A,
      operation: "vote",
      maxPerMonth: MAX_PER_MONTH,
    });
    expect(atLimit).toBe(true);

    const overLimit = await store.incrementIfAllowed({
      daoName: DAO,
      governorAddress: GOVERNOR,
      address: ADDR_A,
      operation: "vote",
      maxPerMonth: MAX_PER_MONTH,
    });
    expect(overLimit).toBe(false);
  });

  it("entries from a previous month do not count", async () => {
    for (let i = 0; i < MAX_PER_MONTH; i++)
      insertUsage(ADDR_A, "vote", previousMonthTs());

    const granted = await store.incrementIfAllowed({
      daoName: DAO,
      governorAddress: GOVERNOR,
      address: ADDR_A,
      operation: "vote",
      maxPerMonth: MAX_PER_MONTH,
    });
    expect(granted).toBe(true);
  });

  it("isolates counters between addresses", async () => {
    for (let i = 0; i < MAX_PER_MONTH; i++) insertUsage(ADDR_A, "vote");

    const granted = await store.incrementIfAllowed({
      daoName: DAO,
      governorAddress: GOVERNOR,
      address: ADDR_B,
      operation: "vote",
      maxPerMonth: MAX_PER_MONTH,
    });
    expect(granted).toBe(true);
  });

  it("vote and delegation have independent counters", async () => {
    for (let i = 0; i < MAX_PER_MONTH; i++) insertUsage(ADDR_A, "vote");

    const granted = await store.incrementIfAllowed({
      daoName: DAO,
      governorAddress: GOVERNOR,
      address: ADDR_A,
      operation: "delegation",
      maxPerMonth: MAX_PER_MONTH,
    });
    expect(granted).toBe(true);
  });
});

describe("RedisRateLimitStorage.getCount", () => {
  it("returns 0 when no calls have been made", async () => {
    const count = await store.getCount({
      daoName: DAO,
      governorAddress: GOVERNOR,
      address: ADDR_A,
      operation: "vote",
    });

    expect(count).toBe(0);
  });

  it("reflects current usage without consuming the limit", async () => {
    await store.incrementIfAllowed({
      daoName: DAO,
      governorAddress: GOVERNOR,
      address: ADDR_A,
      operation: "vote",
      maxPerMonth: MAX_PER_MONTH,
    });
    await store.incrementIfAllowed({
      daoName: DAO,
      governorAddress: GOVERNOR,
      address: ADDR_A,
      operation: "vote",
      maxPerMonth: MAX_PER_MONTH,
    });

    // Read multiple times — must not consume slots.
    for (let i = 0; i < 5; i++) {
      const count = await store.getCount({
        daoName: DAO,
        governorAddress: GOVERNOR,
        address: ADDR_A,
        operation: "vote",
      });
      expect(count).toBe(2);
    }

    // Third increment must still be granted (limit is 3) — proving reads didn't consume.
    const granted = await store.incrementIfAllowed({
      daoName: DAO,
      governorAddress: GOVERNOR,
      address: ADDR_A,
      operation: "vote",
      maxPerMonth: MAX_PER_MONTH,
    });
    expect(granted).toBe(true);
  });

  it("ignores entries from a previous UTC-month window", async () => {
    insertUsage(ADDR_A, "vote", previousMonthTs());

    const count = await store.getCount({
      daoName: DAO,
      governorAddress: GOVERNOR,
      address: ADDR_A,
      operation: "vote",
    });

    expect(count).toBe(0);
  });
});
```

- [ ] **Step 2: Run the storage test to verify it fails**

Run: `pnpm --filter=@anticapture/relayer exec vitest run src/repository/rate-limit-storage.test.ts`
Expected: FAIL — `monthlyKey` is not exported / `maxPerMonth` not in params.

- [ ] **Step 3: Rewrite the storage implementation**

Replace the entire contents of `apps/relayer/src/repository/rate-limit-storage.ts` with:

```ts
import { getAddress } from "viem";
import type { Address } from "viem";

export type RelayOperation = "vote" | "delegation";

export interface IncrementIfAllowedParams {
  daoName: string;
  governorAddress: Address;
  address: Address;
  operation: RelayOperation;
  maxPerMonth: number;
}

export interface GetCountParams {
  daoName: string;
  governorAddress: Address;
  address: Address;
  operation: RelayOperation;
}

export interface RateLimitStorage {
  incrementIfAllowed(params: IncrementIfAllowedParams): Promise<boolean>;
  getCount(params: GetCountParams): Promise<number>;
}

export interface RedisClient {
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<unknown>;
  get(key: string): Promise<string | null>;
}

/**
 * Builds a stable Redis key scoped to a DAO, governor, wallet address, and operation type.
 * Addresses are checksummed via EIP-55 to prevent key collisions from mixed-case inputs.
 *
 * Example: `"MyDAO:0xAbc...123:0xDef...456:vote"`
 */
export function buildKey(
  daoName: string,
  governorAddress: Address,
  address: Address,
  operation: RelayOperation,
): string {
  return `${daoName}:${getAddress(governorAddress)}:${getAddress(address)}:${operation}`;
}

/**
 * Appends a UTC calendar-month bucket suffix to a base key, derived from a Unix timestamp in
 * milliseconds. Uses a fixed window aligned to the first of the month — the counter resets at
 * 00:00 UTC on the 1st, not 30 days after the first request.
 *
 * Example: `"MyDAO:0xAbc...:vote:m:2026-06"`
 */
export function monthlyKey(base: string, timestampMs: number): string {
  const date = new Date(timestampMs);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${base}:m:${year}-${month}`;
}

/**
 * Seconds remaining until 00:00 UTC on the first day of the next month, relative to the given
 * timestamp. Used as the TTL on first increment so the bucket self-expires exactly at the month
 * boundary.
 */
export function secondsUntilNextUtcMonth(timestampMs: number): number {
  const date = new Date(timestampMs);
  const nextMonthMs = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    1,
  );
  return Math.ceil((nextMonthMs - timestampMs) / 1000);
}

/** Redis-backed rate limit store using a monthly fixed-window counter per (DAO, governor, address, operation) tuple. */
export class RedisRateLimitStorage implements RateLimitStorage {
  constructor(private redis: RedisClient) {}

  /**
   * Atomically increments the monthly counter for the given params and returns whether the
   * operation is within the allowed limit.
   *
   * On the first increment of the month, a TTL is set so the key expires at the next UTC month
   * boundary. Returns `false` once the count exceeds `maxPerMonth`.
   */
  async incrementIfAllowed({
    daoName,
    governorAddress,
    address,
    operation,
    maxPerMonth,
  }: IncrementIfAllowedParams): Promise<boolean> {
    const base = buildKey(daoName, governorAddress, address, operation);
    const now = Date.now();
    const monthKey = monthlyKey(base, now);

    const monthCount = await this.redis.incr(monthKey);
    if (monthCount === 1) {
      await this.redis.expire(monthKey, secondsUntilNextUtcMonth(now));
    }

    return monthCount <= maxPerMonth;
  }

  /**
   * Reads the current monthly counter without incrementing. Returns 0 if no calls have been made
   * in the current UTC-month window (or if the key has expired).
   */
  async getCount({
    daoName,
    governorAddress,
    address,
    operation,
  }: GetCountParams): Promise<number> {
    const base = buildKey(daoName, governorAddress, address, operation);
    const monthKey = monthlyKey(base, Date.now());

    const raw = await this.redis.get(monthKey);
    return raw === null ? 0 : Number(raw);
  }
}
```

- [ ] **Step 4: Update the `rate-limiter.ts` call site and both fake stores**

In `apps/relayer/src/services/guards/rate-limiter.ts`, change the store call (currently `maxPerDay: this.config.maxPerAddressPerDay`) to:

```ts
        maxPerMonth: this.config.maxPerAddressPerDay,
```

(Leave the `RateLimiterConfig` interface untouched here — it is rewritten in Task 3.)

In `apps/relayer/src/services/guards/rate-limiter.test.ts`, update the fake store (lines ~18-31) so its destructured param and comparison use `maxPerMonth`:

```ts
    async incrementIfAllowed({
      address,
      operation,
      maxPerMonth,
    }: IncrementIfAllowedParams) {
      const id = `${address}:${operation}`;
      const next = (counters.get(id) ?? 0) + 1;
      counters.set(id, next);
      return next <= maxPerMonth;
    },
```

- [ ] **Step 5: Run storage test (green) + full relayer suite + typecheck + lint**

Run: `pnpm --filter=@anticapture/relayer exec vitest run src/repository/rate-limit-storage.test.ts`
Expected: PASS.

Run: `pnpm relayer test && pnpm relayer typecheck && pnpm relayer lint`
Expected: all PASS / no errors.

- [ ] **Step 6: Commit**

```bash
git add apps/relayer/src/repository/rate-limit-storage.ts \
        apps/relayer/src/repository/rate-limit-storage.test.ts \
        apps/relayer/src/services/guards/rate-limiter.ts \
        apps/relayer/src/services/guards/rate-limiter.test.ts
git commit -m "$(cat <<'EOF'
feat(relayer): bucket rate-limit counters by UTC calendar month

Replace the daily fixed window with a YYYY-MM (UTC) bucket that expires at
the next month boundary, and rename the storage limit param to maxPerMonth.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: Limit resolution helper + default constant

Add the pure `resolveRelayLimits()` and `DEFAULT_RELAY_LIMIT`. Additive only — nothing consumes them yet, so the package stays green.

**Files:**

- Modify: `apps/relayer/src/services/guards/rate-limiter.ts`
- Modify: `apps/relayer/src/services/guards/rate-limiter.test.ts`

- [ ] **Step 1: Add the failing acceptance-matrix tests**

At the top of `apps/relayer/src/services/guards/rate-limiter.test.ts`, extend the import from `./rate-limiter`:

```ts
import {
  RateLimiter,
  resolveRelayLimits,
  DEFAULT_RELAY_LIMIT,
} from "./rate-limiter";
```

Then append this `describe` block to the end of the file:

```ts
describe("resolveRelayLimits", () => {
  it("falls back to DEFAULT_RELAY_LIMIT for both when nothing is set", () => {
    expect(resolveRelayLimits({})).toEqual({
      vote: DEFAULT_RELAY_LIMIT,
      delegation: DEFAULT_RELAY_LIMIT,
    });
  });

  it("uses the votes override and defaults delegation", () => {
    expect(resolveRelayLimits({ votes: 10 })).toEqual({
      vote: 10,
      delegation: DEFAULT_RELAY_LIMIT,
    });
  });

  it("uses the delegations override and defaults vote", () => {
    expect(resolveRelayLimits({ delegations: 7 })).toEqual({
      vote: DEFAULT_RELAY_LIMIT,
      delegation: 7,
    });
  });

  it("uses both overrides when both are set", () => {
    expect(resolveRelayLimits({ votes: 10, delegations: 7 })).toEqual({
      vote: 10,
      delegation: 7,
    });
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter=@anticapture/relayer exec vitest run src/services/guards/rate-limiter.test.ts`
Expected: FAIL — `resolveRelayLimits` / `DEFAULT_RELAY_LIMIT` not exported.

- [ ] **Step 3: Add the constant + helper**

In `apps/relayer/src/services/guards/rate-limiter.ts`, immediately after the `export type { RelayOperation };` line, insert:

```ts
/** Fallback per-operation monthly relay limit, used when an operation's env override is unset. */
export const DEFAULT_RELAY_LIMIT = 3;

/**
 * Resolves the per-operation monthly limits, applying DEFAULT_RELAY_LIMIT to any operation whose
 * env override is unset. Pure function — the single source of the fallback rule.
 */
export function resolveRelayLimits(input: {
  votes?: number;
  delegations?: number;
}): Record<RelayOperation, number> {
  return {
    vote: input.votes ?? DEFAULT_RELAY_LIMIT,
    delegation: input.delegations ?? DEFAULT_RELAY_LIMIT,
  };
}
```

- [ ] **Step 4: Run tests (green) + typecheck + lint**

Run: `pnpm relayer test && pnpm relayer typecheck && pnpm relayer lint`
Expected: all PASS / no errors.

- [ ] **Step 5: Commit**

```bash
git add apps/relayer/src/services/guards/rate-limiter.ts \
        apps/relayer/src/services/guards/rate-limiter.test.ts
git commit -m "$(cat <<'EOF'
feat(relayer): add resolveRelayLimits with DEFAULT_RELAY_LIMIT fallback

Pure helper resolving per-operation monthly limits, defaulting each
operation to 3 when its override is unset.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: Core switch — per-operation limits end to end

Wire the per-operation limits through the env, limiter config, both controllers/schemas, the app composition, and the e2e helper. This is one atomic change: every site that referenced the single daily limit moves to the per-operation `relayLimits` map.

**Files:**

- Modify: `apps/relayer/src/env.ts:40`
- Modify: `apps/relayer/src/services/guards/rate-limiter.ts` (config interface + call site)
- Modify: `apps/relayer/src/services/guards/rate-limiter.test.ts` (config shape + per-op test)
- Modify: `apps/relayer/src/schemas/config.ts`
- Modify: `apps/relayer/src/controllers/config.ts`
- Modify: `apps/relayer/src/schemas/rate-limit.ts`
- Modify: `apps/relayer/src/controllers/rate-limit.ts`
- Modify: `apps/relayer/src/index.ts`
- Modify: `apps/relayer/e2e/helpers/app.ts:59-66`

- [ ] **Step 1: Update the rate-limiter tests to the `limits` config + add a per-op enforcement test**

In `apps/relayer/src/services/guards/rate-limiter.test.ts`, change BOTH `RateLimiter` config objects (the one in `beforeEach` ~line 37-42 and the broken-store one ~line 84-88) from `maxPerAddressPerDay: 3` to:

```ts
    limits: { vote: 3, delegation: 3 },
```

Then add this test inside the existing `describe("RateLimiter", ...)` block:

```ts
it("enforces independent per-operation limits", async () => {
  const limiter2 = new RateLimiter(makeStore(), {
    daoName: DAO,
    governorAddress: GOVERNOR,
    limits: { vote: 2, delegation: 5 },
  });

  for (let i = 0; i < 2; i++) await limiter2.assertWithinLimit(ADDR, "vote");
  await expect(limiter2.assertWithinLimit(ADDR, "vote")).rejects.toMatchObject({
    code: "RATE_LIMITED",
  });

  // delegation has a higher limit and is unaffected by the exhausted vote bucket
  for (let i = 0; i < 5; i++)
    await limiter2.assertWithinLimit(ADDR, "delegation");
  await expect(
    limiter2.assertWithinLimit(ADDR, "delegation"),
  ).rejects.toMatchObject({ code: "RATE_LIMITED" });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `pnpm --filter=@anticapture/relayer exec vitest run src/services/guards/rate-limiter.test.ts`
Expected: FAIL — `limits` is not assignable to `RateLimiterConfig` (still `maxPerAddressPerDay`).

- [ ] **Step 3: Change the `RateLimiter` config to `limits`**

In `apps/relayer/src/services/guards/rate-limiter.ts`, replace the `RateLimiterConfig` interface:

```ts
interface RateLimiterConfig {
  daoName: string;
  governorAddress: Address;
  limits: Record<RelayOperation, number>;
}
```

and change the store call from `maxPerMonth: this.config.maxPerAddressPerDay` to:

```ts
        maxPerMonth: this.config.limits[operation],
```

- [ ] **Step 4: Verify the rate-limiter test passes**

Run: `pnpm --filter=@anticapture/relayer exec vitest run src/services/guards/rate-limiter.test.ts`
Expected: PASS.

- [ ] **Step 5: Swap the env vars**

In `apps/relayer/src/env.ts`, remove the line:

```ts
  MAX_RELAY_PER_ADDRESS_PER_DAY: z.coerce.number().int().optional().default(3),
```

and replace it with:

```ts
  // Per address, per calendar month (UTC). Optional; each defaults to DEFAULT_RELAY_LIMIT (3).
  MAX_VOTES_PER_ADDRESS_PER_MONTH: z.coerce.number().int().positive().optional(),
  MAX_DELEGATIONS_PER_ADDRESS_PER_MONTH: z.coerce.number().int().positive().optional(),
```

- [ ] **Step 6: Update the config schema + controller**

Replace the contents of `apps/relayer/src/schemas/config.ts` with:

```ts
import { z } from "@hono/zod-openapi";

export const ConfigResponseSchema = z
  .object({
    minVotingPower: z.string().openapi({
      format: "bigint",
      description:
        "Minimum voting power required to relay, as a decimal string (uint256).",
    }),
    limits: z
      .object({
        vote: z.number().int().min(0),
        delegation: z.number().int().min(0),
      })
      .openapi({
        description:
          "Maximum number of relays per address per calendar month (UTC), per operation.",
      }),
  })
  .openapi("RelayerConfigResponse");
```

In `apps/relayer/src/controllers/config.ts`, change the deps interface and the response body. Replace:

```ts
interface ConfigControllerDeps {
  minVotingPower: string;
  maxRelayPerAddressPerDay: number;
}
```

with:

```ts
interface ConfigControllerDeps {
  minVotingPower: string;
  limits: { vote: number; delegation: number };
}
```

and replace the `c.json({...})` body with:

```ts
      c.json(
        {
          minVotingPower: deps.minVotingPower,
          limits: deps.limits,
        },
        200,
      ),
```

- [ ] **Step 7: Update the rate-limit schema + controller**

Replace the contents of `apps/relayer/src/schemas/rate-limit.ts` with:

```ts
import { z } from "@hono/zod-openapi";

import { AddressSchema } from "@/schemas/evm-primitives";

export const RateLimitParamsSchema = z.object({
  address: AddressSchema,
});

const OperationUsageSchema = z.object({
  used: z.number().int().min(0),
  remaining: z.number().int().min(0),
  limit: z.number().int().min(0),
});

export const RateLimitResponseSchema = z
  .object({
    address: AddressSchema.describe("EIP-55 checksummed Ethereum address."),
    vote: OperationUsageSchema,
    delegation: OperationUsageSchema,
    resetsAt: z.iso
      .datetime()
      .describe("ISO 8601 timestamp of the next UTC month start."),
  })
  .openapi("RelayerRateLimitResponse");
```

In `apps/relayer/src/controllers/rate-limit.ts`:

Replace the deps interface + the day constant/helper:

```ts
interface RateLimitControllerDeps {
  storage: RateLimitStorage;
  daoName: string;
  governorAddress: Address;
  limits: { vote: number; delegation: number };
}

function nextUtcMonthStartIso(now: number): string {
  const date = new Date(now);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1),
  ).toISOString();
}
```

(Delete the old `const DAY_MS = 86_400_000;` and `function nextUtcMidnightIso(...)`. Keep `clampRemaining`.)

Change the route `summary` to:

```ts
      summary: "Per-address relay usage for the current UTC month",
```

Replace the final `c.json({...})` response with:

```ts
return c.json(
  {
    address,
    vote: {
      used: voteUsed,
      remaining: clampRemaining(voteUsed, deps.limits.vote),
      limit: deps.limits.vote,
    },
    delegation: {
      used: delegationUsed,
      remaining: clampRemaining(delegationUsed, deps.limits.delegation),
      limit: deps.limits.delegation,
    },
    resetsAt: nextUtcMonthStartIso(Date.now()),
  },
  200,
);
```

- [ ] **Step 8: Wire `relayLimits` in `index.ts` + startup log**

In `apps/relayer/src/index.ts`:

Change the rate-limiter import to also import the resolver:

```ts
import {
  RateLimiter,
  resolveRelayLimits,
} from "@/services/guards/rate-limiter";
```

Immediately after `const rateLimitStorage = wrapWithTracing(new RedisRateLimitStorage(redis));`, add:

```ts
const relayLimits = resolveRelayLimits({
  votes: env.MAX_VOTES_PER_ADDRESS_PER_MONTH,
  delegations: env.MAX_DELEGATIONS_PER_ADDRESS_PER_MONTH,
});
```

In the `RateLimiter` construction, replace `maxPerAddressPerDay: env.MAX_RELAY_PER_ADDRESS_PER_DAY,` with:

```ts
      limits: relayLimits,
```

In the `config(app, {...})` call, replace `maxRelayPerAddressPerDay: env.MAX_RELAY_PER_ADDRESS_PER_DAY,` with:

```ts
    limits: relayLimits,
```

In the `rateLimit(app, {...})` call, replace `maxPerDay: env.MAX_RELAY_PER_ADDRESS_PER_DAY,` with:

```ts
    limits: relayLimits,
```

In the "Relayer starting" `logger.info({...})` call, add these two fields to the object (after `token: tokenAddress,`):

```ts
      voteLimitPerMonth: relayLimits.vote,
      delegationLimitPerMonth: relayLimits.delegation,
```

- [ ] **Step 9: Update the e2e helper**

In `apps/relayer/e2e/helpers/app.ts`, replace the `RateLimiter` config (`maxPerAddressPerDay: 50`) so the block reads:

```ts
const rateLimiter = new RateLimiter(
  { incrementIfAllowed: async () => true, getCount: async () => 0 },
  {
    daoName: "test",
    governorAddress: GOVERNOR_ADDRESS,
    limits: { vote: 50, delegation: 50 },
  },
);
```

- [ ] **Step 10: Verify the whole relayer package is green**

Run: `pnpm relayer test && pnpm relayer typecheck && pnpm relayer lint`
Expected: all PASS / no errors. (Confirm no remaining references: `grep -rn "MAX_RELAY_PER_ADDRESS_PER_DAY\|maxPerAddressPerDay\|maxRelayPerAddressPerDay\|maxPerDay\|nextUtcMidnight\|dailyKey" apps/relayer/src apps/relayer/e2e` returns nothing.)

- [ ] **Step 11: Commit**

```bash
git add apps/relayer/src apps/relayer/e2e
git commit -m "$(cat <<'EOF'
feat(relayer): per-operation monthly rate limits end to end

Replace MAX_RELAY_PER_ADDRESS_PER_DAY with optional
MAX_VOTES_PER_ADDRESS_PER_MONTH / MAX_DELEGATIONS_PER_ADDRESS_PER_MONTH,
carry a per-operation limits map through the limiter, and expose per-op
limits + a monthly resetsAt on /relay/config and /relay/rate-limit.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Update `.env.example`

**Files:**

- Modify: `apps/relayer/.env.example:21-22`

- [ ] **Step 1: Replace the rate-limiting block**

In `apps/relayer/.env.example`, replace:

```
# Rate limiting
MAX_RELAY_PER_ADDRESS_PER_DAY=3
```

with:

```
# Rate limiting — per address, per calendar month (UTC).
# Both are optional; each defaults to 3 when unset.
# MAX_VOTES_PER_ADDRESS_PER_MONTH=3
# MAX_DELEGATIONS_PER_ADDRESS_PER_MONTH=3
```

> Do NOT touch `apps/relayer/.env` (boundary rule: never modify `.env` files).

- [ ] **Step 2: Commit**

```bash
git add apps/relayer/.env.example
git commit -m "$(cat <<'EOF'
docs(relayer): document monthly per-operation rate-limit env vars

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Downstream — Gateful spec, client SDK, dashboard hook

Update the committed Gateful OpenAPI snapshot to match the relayer's new schemas, regenerate the client, and update the only dashboard consumer. (Editing `gateful.json` directly is safe: it is a runtime-regenerated snapshot, and the relayer schemas are the source of truth — Gateful re-emits the identical JSON on its next run. No live services are needed for `pnpm client codegen`.)

**Files:**

- Modify: `apps/gateful/openapi/gateful.json` (the two relayer schema blocks)
- Regenerate: `packages/anticapture-client/generated/*`
- Modify: `apps/dashboard/shared/hooks/useGaslessRelayer.ts`

- [ ] **Step 1: Update `RelayerConfigResponse` in `gateful.json`**

In `apps/gateful/openapi/gateful.json`, replace the entire `"RelayerConfigResponse": { ... }` block with:

```json
      "RelayerConfigResponse": {
        "type": "object",
        "properties": {
          "minVotingPower": {
            "type": "string",
            "format": "bigint",
            "description": "Minimum voting power required to relay, as a decimal string (uint256)."
          },
          "limits": {
            "type": "object",
            "properties": {
              "vote": { "type": "integer", "minimum": 0 },
              "delegation": { "type": "integer", "minimum": 0 }
            },
            "required": ["vote", "delegation"],
            "description": "Maximum number of relays per address per calendar month (UTC), per operation."
          }
        },
        "required": ["minVotingPower", "limits"]
      },
```

- [ ] **Step 2: Update `RelayerRateLimitResponse` in `gateful.json`**

Replace the entire `"RelayerRateLimitResponse": { ... }` block with:

```json
      "RelayerRateLimitResponse": {
        "type": "object",
        "properties": {
          "address": {
            "type": "string",
            "description": "EIP-55 checksummed Ethereum address."
          },
          "vote": {
            "type": "object",
            "properties": {
              "used": { "type": "integer", "minimum": 0 },
              "remaining": { "type": "integer", "minimum": 0 },
              "limit": { "type": "integer", "minimum": 0 }
            },
            "required": ["used", "remaining", "limit"]
          },
          "delegation": {
            "type": "object",
            "properties": {
              "used": { "type": "integer", "minimum": 0 },
              "remaining": { "type": "integer", "minimum": 0 },
              "limit": { "type": "integer", "minimum": 0 }
            },
            "required": ["used", "remaining", "limit"]
          },
          "resetsAt": {
            "type": "string",
            "format": "date-time",
            "description": "ISO 8601 timestamp of the next UTC month start."
          }
        },
        "required": ["address", "vote", "delegation", "resetsAt"]
      },
```

- [ ] **Step 3: Regenerate the client SDK**

Run: `pnpm client codegen`
Expected: completes without error; `packages/anticapture-client/generated/*` updated.

Verify the new shape landed:

Run: `grep -n "RelayerConfigResponse\|RelayerRateLimitResponse" packages/anticapture-client/generated/models.ts`
Then confirm `limits` and per-op `limit` exist and `maxPerDay`/`maxRelayPerAddressPerDay` are gone:

Run: `grep -rn "maxPerDay\|maxRelayPerAddressPerDay" packages/anticapture-client/generated/`
Expected: no matches.

- [ ] **Step 4: Update the dashboard hook**

In `apps/dashboard/shared/hooks/useGaslessRelayer.ts`:

Replace the `UseRelayerConfigResult` interface:

```ts
interface UseRelayerConfigResult {
  enabled: boolean;
  minVotingPower: bigint | null;
  voteLimit: number | null;
  delegationLimit: number | null;
  isLoading: boolean;
}
```

In `useRelayerConfig`'s `return`, replace `maxRelayPerAddressPerDay: data?.maxRelayPerAddressPerDay ?? null,` with:

```ts
    voteLimit: data?.limits.vote ?? null,
    delegationLimit: data?.limits.delegation ?? null,
```

Replace the `UseRelayerRateLimitResult` interface:

```ts
interface UseRelayerRateLimitResult {
  voteRemaining: number | null;
  delegationRemaining: number | null;
  voteLimit: number | null;
  delegationLimit: number | null;
  resetsAt: string | null;
  isLoading: boolean;
}
```

In `useRelayerRateLimit`'s `return`, replace `maxPerDay: data?.maxPerDay ?? null,` with:

```ts
    voteLimit: data?.vote.limit ?? null,
    delegationLimit: data?.delegation.limit ?? null,
```

- [ ] **Step 5: Verify client + dashboard typecheck (and lint the client)**

Run: `pnpm client typecheck && pnpm client lint && pnpm dashboard typecheck`
Expected: all PASS / no errors. (The dashboard's `DelegationModal.tsx` and `VotingModal.tsx` only read `minVotingPower`, so no other dashboard edits are required — this confirms it.)

- [ ] **Step 6: Commit**

```bash
git add apps/gateful/openapi/gateful.json \
        packages/anticapture-client/generated \
        apps/dashboard/shared/hooks/useGaslessRelayer.ts
git commit -m "$(cat <<'EOF'
feat: propagate relayer monthly per-operation limits to client + dashboard

Update the Gateful OpenAPI snapshot for the new relayer contract,
regenerate the kubb client SDK, and read the per-operation limits in the
gasless relayer hook.

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Changeset

One changeset covering the three packages that change behavior. The dashboard is intentionally omitted: bumping `@anticapture/client` cascades an automatic `patch` to its workspace consumers (`updateInternalDependencies: "patch"`), and the hook edit is an internal adaptation, not a user-visible dashboard behavior change. This single file also satisfies `api-contract-updates.yaml` (it requires a `@anticapture/gateful` changeset when the merged spec changes).

**Files:**

- Create: `.changeset/relayer-monthly-per-operation-limits.md`

- [ ] **Step 1: Create the changeset**

Create `.changeset/relayer-monthly-per-operation-limits.md` with:

```markdown
---
"@anticapture/relayer": minor
"@anticapture/gateful": minor
"@anticapture/client": minor
---

Switch relayer rate limiting from a shared daily window to per-operation monthly limits (separate caps for votes and delegations), configurable via `MAX_VOTES_PER_ADDRESS_PER_MONTH` and `MAX_DELEGATIONS_PER_ADDRESS_PER_MONTH` (each defaulting to 3). The `/relay/config` and `/relay/rate-limit/{address}` responses now expose per-operation `limits`/`limit` and a monthly `resetsAt`; the client SDK is regenerated to match.
```

> If you prefer the interactive CLI, `pnpm changeset` produces an equivalent file — select `@anticapture/relayer`, `@anticapture/gateful`, `@anticapture/client`, all `minor`, and paste the summary above.

- [ ] **Step 2: Commit**

```bash
git add .changeset/relayer-monthly-per-operation-limits.md
git commit -m "$(cat <<'EOF'
chore: changeset for relayer monthly per-operation rate limits

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
EOF
)"
```

---

## Task 7: Final whole-repo verification

**Files:** none (verification only).

- [ ] **Step 1: Run monorepo typecheck + lint**

Run: `pnpm typecheck && pnpm lint`
Expected: all PASS / no errors across packages.

- [ ] **Step 2: Run relayer unit tests once more**

Run: `pnpm relayer test`
Expected: PASS.

- [ ] **Step 3: (Optional) relayer e2e**

The e2e suite (`pnpm relayer test:e2e`) hits a real RPC and needs env (`RPC_URL` etc.); run only if that env is available locally. The e2e helper change is already covered by `pnpm relayer typecheck`. If env is unavailable, note it as skipped rather than marking it passed.

- [ ] **Step 4: Confirm the branch is clean**

Run: `git status`
Expected: working tree clean, all task commits present on `feat/relayer-monthly-rate-limits`.

---

## Self-review

**Spec coverage:**

- Daily → monthly window → Task 1. ✓
- `DEFAULT_RELAY_LIMIT = 3` constant → Task 2. ✓
- Granular optional env vars + per-op fallback → Task 2 (`resolveRelayLimits`) + Task 3 (env). ✓
- Per-operation limits in limiter + controllers → Task 3. ✓
- Nested response shape (config `limits`; rate-limit per-op `limit`) → Task 3 + Task 5 (spec). ✓
- Startup logs → Task 3 Step 8. ✓
- Tests (storage, limiter, acceptance matrix) → Tasks 1–3. ✓ Plus e2e helper fix → Task 3 Step 9. ✓
- `.env.example` → Task 4. ✓
- Full ripple: gateful + client + dashboard → Task 5. ✓
- Changeset → Task 6. ✓
- Acceptance criteria (none set → 3/3; one set; both set) → covered by `resolveRelayLimits` tests in Task 2. ✓

**Placeholder scan:** No TBD/TODO; every code step contains complete content. ✓

**Type consistency:** `maxPerMonth` (storage param) is consistent across Tasks 1 & 3. `limits: Record<RelayOperation, number>` (limiter) is structurally assignable to the controllers' `{ vote: number; delegation: number }` deps and to `relayLimits`. `resolveRelayLimits` / `DEFAULT_RELAY_LIMIT` names match between Tasks 2 & 3 and the test imports. Hook fields `voteLimit`/`delegationLimit` are introduced and consumed only within the hook. ✓
