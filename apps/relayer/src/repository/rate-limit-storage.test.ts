import { describe, it, expect, beforeEach } from "vitest";
import { getAddress } from "viem";

import {
  RedisRateLimitStorage,
  buildKey,
  monthlyKey,
  secondsUntilNextUtcMonth,
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

describe("secondsUntilNextUtcMonth", () => {
  it("counts the seconds remaining from mid-month to the next month start", () => {
    // 2026-06-15T00:00:00Z → next boundary is 2026-07-01T00:00:00Z = 16 days later.
    const midMonth = Date.UTC(2026, 5, 15);
    expect(secondsUntilNextUtcMonth(midMonth)).toBe(16 * 24 * 60 * 60);
  });

  it("returns a full month of seconds at the exact month start", () => {
    // 2026-06-01T00:00:00Z → next boundary 2026-07-01T00:00:00Z = 30 days (June has 30).
    const monthStart = Date.UTC(2026, 5, 1);
    expect(secondsUntilNextUtcMonth(monthStart)).toBe(30 * 24 * 60 * 60);
  });

  it("rounds up to at least 1 second just before a month boundary", () => {
    // 1 ms before 2026-07-01T00:00:00Z must round up to 1 (never 0).
    const justBeforeBoundary = Date.UTC(2026, 6, 1) - 1;
    expect(secondsUntilNextUtcMonth(justBeforeBoundary)).toBe(1);
  });

  it("handles the December → January year rollover", () => {
    // 2026-12-15T00:00:00Z → next boundary 2027-01-01T00:00:00Z = 17 days later.
    const december = Date.UTC(2026, 11, 15);
    expect(secondsUntilNextUtcMonth(december)).toBe(17 * 24 * 60 * 60);
  });
});
