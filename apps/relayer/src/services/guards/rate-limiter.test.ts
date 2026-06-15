import { describe, it, expect, beforeEach } from "vitest";
import { getAddress } from "viem";

import type {
  IncrementIfAllowedParams,
  RateLimitStorage,
} from "@/repository/rate-limit-storage";
import {
  RateLimiter,
  resolveRelayLimits,
  DEFAULT_RELAY_LIMIT,
} from "./rate-limiter";

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
      maxPerMonth,
    }: IncrementIfAllowedParams) {
      const id = `${address}:${operation}`;
      const next = (counters.get(id) ?? 0) + 1;
      counters.set(id, next);
      return next <= maxPerMonth;
    },
    async getCount({ address, operation }) {
      return counters.get(`${address}:${operation}`) ?? 0;
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

  it("blocks when monthly limit is exceeded", async () => {
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
    const brokenStore: RateLimitStorage = {
      incrementIfAllowed: () => Promise.reject(new Error("connection refused")),
      getCount: () => Promise.reject(new Error("connection refused")),
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
