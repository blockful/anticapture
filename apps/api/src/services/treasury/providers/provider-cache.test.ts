import { expect, afterEach, beforeEach, vi, describe, it } from "vitest";
import { TreasuryProviderCache } from "./provider-cache";
import { LiquidTreasuryDataPoint } from "../types";

function createDataPoint(
  overrides?: Partial<LiquidTreasuryDataPoint>,
): LiquidTreasuryDataPoint {
  return {
    date: 1700000000,
    liquidTreasury: 1000000,
    ...overrides,
  };
}

describe("TreasuryProviderCache", () => {
  let cache: TreasuryProviderCache;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
    cache = new TreasuryProviderCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("get", () => {
    it("should return null when cache is empty", () => {
      const result = cache.get();

      expect(result).toBeNull();
    });

    it("should return cached data when not expired", () => {
      const data = [createDataPoint(), createDataPoint({ date: 1700086400 })];
      cache.set(data);

      const result = cache.get();

      expect(result).toEqual(data);
    });

    it("should return null when cache is expired", () => {
      const data = [createDataPoint()];
      cache.set(data);
      vi.advanceTimersByTime(25 * 60 * 60 * 1000);

      const result = cache.get();

      expect(result).toBeNull();
    });

    it("should clear cache when expired", () => {
      const data = [createDataPoint()];
      cache.set(data);
      vi.advanceTimersByTime(25 * 60 * 60 * 1000);

      cache.get();

      vi.setSystemTime(new Date("2025-01-16T13:00:00Z"));
      const newData = [createDataPoint({ liquidTreasury: 2000000 })];
      cache.set(newData);

      expect(cache.get()).toEqual(newData);
    });

    it("should return data at exactly 24 hours (boundary)", () => {
      const data = [createDataPoint()];
      cache.set(data);
      vi.advanceTimersByTime(24 * 60 * 60 * 1000);

      const result = cache.get();

      expect(result).toEqual(data);
    });

    it("should return null at 24 hours + 1ms (just expired)", () => {
      const data = [createDataPoint()];
      cache.set(data);
      vi.advanceTimersByTime(24 * 60 * 60 * 1000 + 1);

      const result = cache.get();

      expect(result).toBeNull();
    });
  });

  describe("set", () => {
    it("should store data that can be retrieved", () => {
      const data = [
        createDataPoint({ date: 1700000000, liquidTreasury: 500000 }),
      ];

      cache.set(data);

      expect(cache.get()).toEqual(data);
    });

    it("should overwrite previous data", () => {
      const oldData = [createDataPoint({ liquidTreasury: 100 })];
      const newData = [createDataPoint({ liquidTreasury: 200 })];
      cache.set(oldData);

      cache.set(newData);

      expect(cache.get()).toEqual(newData);
    });

    it("should reset TTL when setting new data", () => {
      const oldData = [createDataPoint({ liquidTreasury: 100 })];
      cache.set(oldData);
      vi.advanceTimersByTime(23 * 60 * 60 * 1000);

      const newData = [createDataPoint({ liquidTreasury: 200 })];
      cache.set(newData);
      vi.advanceTimersByTime(23 * 60 * 60 * 1000);

      const result = cache.get();

      expect(result).toEqual(newData);
    });

    it("should handle empty array", () => {
      const data: LiquidTreasuryDataPoint[] = [];

      cache.set(data);

      expect(cache.get()).toEqual([]);
    });
  });

  describe("clear", () => {
    it("should remove all cached data", () => {
      const data = [createDataPoint()];
      cache.set(data);

      cache.clear();

      expect(cache.get()).toBeNull();
    });

    it("should be safe to call on empty cache", () => {
      expect(() => cache.clear()).not.toThrow();
      expect(cache.get()).toBeNull();
    });
  });
});
