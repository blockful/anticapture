import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DaoCache } from "@/cache/dao-cache";
import { DaoResponse } from "@/mappers";

function createDaoResponse(overrides?: Partial<DaoResponse>): DaoResponse {
  return {
    id: "dao-1",
    chainId: 1,
    quorum: "100000",
    proposalThreshold: "1000",
    votingDelay: "7200",
    votingPeriod: "50400",
    timelockDelay: "172800",
    alreadySupportCalldataReview: false,
    ...overrides,
  };
}

describe("DaoCache", () => {
  let cache: DaoCache;
  const ONE_HOUR_MS = 60 * 60 * 1000;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-01-15T12:00:00Z"));
    cache = new DaoCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("get", () => {
    it("should return null for an unknown key", () => {
      const result = cache.get("unknown-dao");

      expect(result).toBeNull();
    });

    it("should return data after set()", () => {
      const data = createDaoResponse();
      cache.set("dao-1", data);

      const result = cache.get("dao-1");

      expect(result).toEqual(data);
    });

    it("should return null after TTL of 1 hour + 1ms (expired)", () => {
      const data = createDaoResponse();
      cache.set("dao-1", data);

      vi.advanceTimersByTime(ONE_HOUR_MS + 1);

      const result = cache.get("dao-1");

      expect(result).toBeNull();
    });

    it("should return data at exactly 1 hour (not yet expired)", () => {
      const data = createDaoResponse();
      cache.set("dao-1", data);

      vi.advanceTimersByTime(ONE_HOUR_MS);

      const result = cache.get("dao-1");

      expect(result).toEqual(data);
    });
  });

  describe("set", () => {
    it("should store data that can be retrieved", () => {
      const data = createDaoResponse();
      cache.set("dao-1", data);

      expect(cache.get("dao-1")).toEqual(data);
    });

    it("should overwrite data for an existing key", () => {
      const oldData = createDaoResponse({ quorum: "100" });
      const newData = createDaoResponse({ quorum: "200" });
      cache.set("dao-1", oldData);

      cache.set("dao-1", newData);

      expect(cache.get("dao-1")).toEqual(newData);
    });
  });

  describe("clear", () => {
    it("should remove all entries", () => {
      cache.set("dao-1", createDaoResponse({ id: "dao-1" }));
      cache.set("dao-2", createDaoResponse({ id: "dao-2" }));

      cache.clear();

      expect(cache.get("dao-1")).toBeNull();
      expect(cache.get("dao-2")).toBeNull();
    });
  });

  describe("multiple keys", () => {
    it("should work independently for different keys", () => {
      const data1 = createDaoResponse({ id: "dao-1", chainId: 1 });
      const data2 = createDaoResponse({ id: "dao-2", chainId: 42161 });
      cache.set("dao-1", data1);
      cache.set("dao-2", data2);

      expect(cache.get("dao-1")).toEqual(data1);
      expect(cache.get("dao-2")).toEqual(data2);
    });

    it("should expire keys independently", () => {
      const data1 = createDaoResponse({ id: "dao-1" });
      cache.set("dao-1", data1);

      vi.advanceTimersByTime(ONE_HOUR_MS - 1);

      const data2 = createDaoResponse({ id: "dao-2" });
      cache.set("dao-2", data2);

      vi.advanceTimersByTime(2);

      // dao-1 is now expired (1 hour + 1ms), dao-2 is still fresh
      expect(cache.get("dao-1")).toBeNull();
      expect(cache.get("dao-2")).toEqual(data2);
    });
  });
});
