import { describe, it, expect, beforeEach } from "vitest";
import { getAddress } from "viem";

import type {
  IncrementIfAllowedParams,
  RateLimitStorage,
} from "@/repository/rate-limit-storage";
import { RateLimiter } from "./rate-limiter";

const DAO = "ens";
const GOVERNOR = getAddress("0x323A76393544d5ecca80cd6ef2A560C6a395b7E3");
const ADDR = getAddress("0x3333333333333333333333333333333333333333");
const OTHER = getAddress("0x4444444444444444444444444444444444444444");

function makeStore(): RateLimitStorage {
  const counters = new Map<string, number>();
  return {
    async incrementIfAllowed({
      address,
      operation,
      maxPerDay,
    }: IncrementIfAllowedParams) {
      const id = `${address}:${operation}`;
      const next = (counters.get(id) ?? 0) + 1;
      counters.set(id, next);
      return next <= maxPerDay;
    },
  };
}

let limiter: RateLimiter;

beforeEach(() => {
  limiter = new RateLimiter(makeStore(), {
    daoName: DAO,
    governorAddress: GOVERNOR,
    maxPerAddressPerDay: 3,
  });
});

describe("RateLimiter", () => {
  it("allows requests within limits", async () => {
    await expect(
      limiter.assertWithinLimit(ADDR, "vote"),
    ).resolves.not.toThrow();
  });

  it("blocks when daily limit is exceeded", async () => {
    for (let i = 0; i < 3; i++) await limiter.assertWithinLimit(ADDR, "vote");

    await expect(limiter.assertWithinLimit(ADDR, "vote")).rejects.toMatchObject(
      {
        code: "RATE_LIMITED",
      },
    );
  });

  it("isolates rate limits per address", async () => {
    for (let i = 0; i < 3; i++) await limiter.assertWithinLimit(ADDR, "vote");

    await expect(
      limiter.assertWithinLimit(OTHER, "vote"),
    ).resolves.not.toThrow();
  });

  it("vote and delegation have independent limits", async () => {
    for (let i = 0; i < 3; i++) await limiter.assertWithinLimit(ADDR, "vote");

    // delegation bucket is empty — should still be allowed
    await expect(
      limiter.assertWithinLimit(ADDR, "delegation"),
    ).resolves.not.toThrow();
  });

  it("throws RATE_LIMITER_UNAVAILABLE when store is unreachable", async () => {
    const brokenStore = {
      incrementIfAllowed: () => Promise.reject(new Error("connection refused")),
    };

    const brokenLimiter = new RateLimiter(brokenStore, {
      daoName: DAO,
      governorAddress: GOVERNOR,
      maxPerAddressPerDay: 3,
    });

    await expect(
      brokenLimiter.assertWithinLimit(ADDR, "vote"),
    ).rejects.toMatchObject({ code: "RATE_LIMITER_UNAVAILABLE" });
  });
});
