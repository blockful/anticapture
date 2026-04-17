import { describe, it, expect, beforeEach } from "vitest";
import { getAddress } from "viem";

import { env } from "@/env";
import {
  RedisRateLimitStorage,
  buildKey,
  dailyKey,
  type RedisClient,
} from "./rate-limit-storage";

const MAX_PER_DAY = env.MAX_RELAY_PER_ADDRESS_PER_DAY;

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

function insertUsage(
  address: ReturnType<typeof getAddress>,
  operation: "vote" | "delegation",
  hoursAgo: number,
): void {
  const base = buildKey(DAO, GOVERNOR, address, operation);
  const ts = Date.now() - hoursAgo * 3_600_000;
  redis.seed(dailyKey(base, ts), 1);
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
      maxPerDay: MAX_PER_DAY,
    });

    expect(granted).toBe(true);
  });

  it("allows up to daily limit and rejects the next request", async () => {
    for (let i = 0; i < MAX_PER_DAY - 1; i++) insertUsage(ADDR_A, "vote", 0.1);

    const atLimit = await store.incrementIfAllowed({
      daoName: DAO,
      governorAddress: GOVERNOR,
      address: ADDR_A,
      operation: "vote",
      maxPerDay: MAX_PER_DAY,
    });
    expect(atLimit).toBe(true);

    const overLimit = await store.incrementIfAllowed({
      daoName: DAO,
      governorAddress: GOVERNOR,
      address: ADDR_A,
      operation: "vote",
      maxPerDay: MAX_PER_DAY,
    });
    expect(overLimit).toBe(false);
  });

  it("old entries outside 24h window do not count", async () => {
    for (let i = 0; i < MAX_PER_DAY; i++) insertUsage(ADDR_A, "vote", 25);

    const granted = await store.incrementIfAllowed({
      daoName: DAO,
      governorAddress: GOVERNOR,
      address: ADDR_A,
      operation: "vote",
      maxPerDay: MAX_PER_DAY,
    });
    expect(granted).toBe(true);
  });

  it("isolates counters between addresses", async () => {
    for (let i = 0; i < MAX_PER_DAY; i++) insertUsage(ADDR_A, "vote", 0.1);

    const granted = await store.incrementIfAllowed({
      daoName: DAO,
      governorAddress: GOVERNOR,
      address: ADDR_B,
      operation: "vote",
      maxPerDay: MAX_PER_DAY,
    });
    expect(granted).toBe(true);
  });

  it("vote and delegation have independent limits", async () => {
    for (let i = 0; i < MAX_PER_DAY; i++) insertUsage(ADDR_A, "vote", 0.1);

    const granted = await store.incrementIfAllowed({
      daoName: DAO,
      governorAddress: GOVERNOR,
      address: ADDR_A,
      operation: "delegation",
      maxPerDay: MAX_PER_DAY,
    });
    expect(granted).toBe(true);
  });
});
