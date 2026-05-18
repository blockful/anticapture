import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { RevenueCache } from "./cache";

describe("RevenueCache", () => {
  let cache: RevenueCache;
  const ONE_DAY = 24 * 60 * 60 * 1000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-15T12:00:00Z"));
    cache = new RevenueCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns null for a missing key", () => {
    expect(cache.get("missing")).toBeNull();
  });

  it("returns cached data within TTL", () => {
    cache.set("k", { value: 1 });
    expect(cache.get("k")).toEqual({ value: 1 });
  });

  it("returns data at exactly 24h boundary", () => {
    cache.set("k", { value: 1 });
    vi.advanceTimersByTime(ONE_DAY);
    expect(cache.get("k")).toEqual({ value: 1 });
  });

  it("returns null after TTL expiry", () => {
    cache.set("k", { value: 1 });
    vi.advanceTimersByTime(ONE_DAY + 1);
    expect(cache.get("k")).toBeNull();
  });

  it("scopes data per key", () => {
    cache.set("a", { value: 1 });
    cache.set("b", { value: 2 });
    expect(cache.get("a")).toEqual({ value: 1 });
    expect(cache.get("b")).toEqual({ value: 2 });
  });

  it("clears all entries", () => {
    cache.set("a", 1);
    cache.set("b", 2);
    cache.clear();
    expect(cache.get("a")).toBeNull();
    expect(cache.get("b")).toBeNull();
  });
});
