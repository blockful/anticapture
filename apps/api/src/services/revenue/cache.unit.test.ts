import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { REVENUE_CACHE_TTL_MS, RevenueCache } from "./cache";

describe("RevenueCache", () => {
  let cache: RevenueCache;

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

  it("returns data at exactly the TTL boundary", () => {
    cache.set("k", { value: 1 });
    vi.advanceTimersByTime(REVENUE_CACHE_TTL_MS);
    expect(cache.get("k")).toEqual({ value: 1 });
  });

  it("returns null after TTL expiry", () => {
    cache.set("k", { value: 1 });
    vi.advanceTimersByTime(REVENUE_CACHE_TTL_MS + 1);
    expect(cache.get("k")).toBeNull();
  });

  it("keeps the TTL short enough for a daily refresh to stay under 36 hours", () => {
    const refreshIntervalMs = 24 * 60 * 60 * 1000;
    expect(refreshIntervalMs + REVENUE_CACHE_TTL_MS).toBeLessThan(
      36 * 60 * 60 * 1000,
    );
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
