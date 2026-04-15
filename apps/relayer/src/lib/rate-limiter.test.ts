import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getAddress } from "viem";

import { RateLimiter } from "./rate-limiter";

const ADDR = getAddress("0x3333333333333333333333333333333333333333");

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  beforeEach(() => {
    vi.useFakeTimers();
    limiter = new RateLimiter({
      maxPerAddressPerDay: 5,
      maxPerAddressPerHour: 2,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("allows requests within limits", () => {
    limiter.recordUsage(ADDR);
    expect(() => limiter.checkAllowed(ADDR)).not.toThrow();
  });

  it("blocks when hourly limit is exceeded", () => {
    limiter.recordUsage(ADDR);
    limiter.recordUsage(ADDR);
    expect(() => limiter.checkAllowed(ADDR)).toThrow("Rate limit");
  });

  it("allows again after an hour passes", () => {
    limiter.recordUsage(ADDR);
    limiter.recordUsage(ADDR);

    // Advance 61 minutes
    vi.advanceTimersByTime(61 * 60 * 1000);

    expect(() => limiter.checkAllowed(ADDR)).not.toThrow();
  });

  it("blocks when daily limit is exceeded", () => {
    for (let i = 0; i < 5; i++) {
      limiter.recordUsage(ADDR);
      vi.advanceTimersByTime(61 * 60 * 1000);
    }

    expect(() => limiter.checkAllowed(ADDR)).toThrow("Rate limit");
  });

  it("does not burn rate limit on failed validation (check vs record split)", () => {
    // checkAllowed is read-only — calling it doesn't consume a slot
    limiter.checkAllowed(ADDR);
    limiter.checkAllowed(ADDR);
    limiter.checkAllowed(ADDR);
    // Still allowed because no recordUsage was called
    expect(() => limiter.checkAllowed(ADDR)).not.toThrow();
  });

  it("isolates rate limits per address", () => {
    const OTHER = getAddress("0x4444444444444444444444444444444444444444");
    limiter.recordUsage(ADDR);
    limiter.recordUsage(ADDR);
    // ADDR is at hourly limit, but OTHER should be fine
    expect(() => limiter.checkAllowed(OTHER)).not.toThrow();
  });
});
