import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { parseEther } from "viem";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { TreasuryRepository } from "@/repositories/treasury";
import {
  TreasuryService,
  TreasuryProvider,
  LiquidTreasuryDataPoint,
  PriceProvider,
} from "@/services/treasury";

import { treasury } from "./index";

/**
 * Fakes for dependency injection
 */
class FakeTreasuryProvider implements TreasuryProvider {
  private data: LiquidTreasuryDataPoint[] = [];

  setData(data: { date: number; value: number }[]) {
    this.data = data.map((item) => ({
      date: item.date,
      liquidTreasury: item.value,
    }));
  }

  async fetchTreasury(
    _cutoffTimestamp: number,
  ): Promise<LiquidTreasuryDataPoint[]> {
    return this.data;
  }
}

class FakePriceProvider implements PriceProvider {
  private prices: Map<number, number> = new Map();

  setPrices(prices: Map<number, number>) {
    this.prices = prices;
  }

  async getHistoricalPricesMap(_days: number): Promise<Map<number, number>> {
    return this.prices;
  }
}

/**
 * FakeTreasuryRepository implements the same interface as TreasuryRepository
 * This enables structural typing without explicit casting
 */
class FakeTreasuryRepository implements Pick<
  TreasuryRepository,
  "getTokenQuantities" | "getLastTokenQuantityBeforeDate"
> {
  private tokenQuantities: Map<number, bigint> = new Map();
  private lastKnownQuantity: bigint | null = null;

  setTokenQuantities(quantities: Map<number, bigint>) {
    this.tokenQuantities = quantities;
  }

  setLastKnownQuantity(quantity: bigint | null) {
    this.lastKnownQuantity = quantity;
  }

  async getTokenQuantities(
    _cutoffTimestamp: number,
  ): Promise<Map<number, bigint>> {
    return this.tokenQuantities;
  }

  async getLastTokenQuantityBeforeDate(
    _cutoffTimestamp: number,
  ): Promise<bigint | null> {
    return this.lastKnownQuantity;
  }
}

/**
 * Creates a test app with treasury routes
 *
 * Note: testClient(app) returns 'unknown' because Hono can't infer types
 * when routes are added dynamically. We use 'as any' as a workaround.
 * See: https://github.com/honojs/hono/issues/3148
 */
function createTestApp(
  treasuryService: TreasuryService,
  decimals: number = 18,
) {
  const app = new Hono();
  treasury(app, treasuryService, decimals);
  return app;
}

describe("Treasury Controller - Integration Tests", () => {
  const FIXED_DATE = new Date("2026-01-15T00:00:00Z");
  const FIXED_TIMESTAMP = Math.floor(FIXED_DATE.getTime() / 1000);
  const ONE_DAY = 86400;

  let fakeProvider: FakeTreasuryProvider;
  let priceRepo: FakePriceProvider;
  let metricsRepo: FakeTreasuryRepository;
  let service: TreasuryService;
  let app: Hono;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);

    fakeProvider = new FakeTreasuryProvider();
    metricsRepo = new FakeTreasuryRepository();
  });

  afterEach(() => {
    vi.useRealTimers();

    metricsRepo.setTokenQuantities(new Map());
  });

  describe("GET /treasury/liquid", () => {
    beforeEach(() => {
      service = new TreasuryService(
        metricsRepo as unknown as TreasuryRepository,
        fakeProvider,
        undefined,
      );
      app = createTestApp(service);
    });

    it("should return 200 with valid response structure", async () => {
      const expected = [
        { date: FIXED_TIMESTAMP - ONE_DAY, value: 1000000 },
        { date: FIXED_TIMESTAMP, value: 1100000 },
      ];
      fakeProvider.setData(expected);

      const res = await app.request("/treasury/liquid");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        items: expected,
        totalCount: expected.length,
      });
    });

    it("should use default values when query params are omitted", async () => {
      const expected = [{ date: FIXED_TIMESTAMP, value: 1000000 }];
      fakeProvider.setData(expected);

      const res = await app.request("/treasury/liquid");
      expect(await res.json()).toEqual({
        items: expected,
        totalCount: expected.length,
      });
    });

    it("should return empty items when no data available", async () => {
      fakeProvider.setData([]);

      const res = await app.request("/treasury/liquid?days=7d");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        items: [],
        totalCount: 0,
      });
    });

    it("should return asc ordered based on the query param", async () => {
      const day1 = FIXED_TIMESTAMP - ONE_DAY * 2;
      const day2 = FIXED_TIMESTAMP - ONE_DAY;
      const day3 = FIXED_TIMESTAMP;

      const expected = [
        { date: day1, value: 1000 },
        { date: day2, value: 2000 },
        { date: day3, value: 3000 },
      ];
      fakeProvider.setData(expected);

      const resAsc = await app.request("/treasury/liquid?days=7d&order=asc");
      expect(await resAsc.json()).toEqual({
        items: expected,
        totalCount: expected.length,
      });
    });

    it("should return desc ordered based on the query param", async () => {
      const day1 = FIXED_TIMESTAMP - ONE_DAY * 2;
      const day2 = FIXED_TIMESTAMP - ONE_DAY;
      const day3 = FIXED_TIMESTAMP;

      const expected = [
        { date: day1, value: 1000 },
        { date: day2, value: 2000 },
        { date: day3, value: 3000 },
      ];
      fakeProvider.setData(expected);

      const res = await app.request("/treasury/liquid?days=7d&order=desc");
      expect(await res.json()).toEqual({
        items: expected.sort((a, b) => b.date - a.date),
        totalCount: 3,
      });
    });
  });

  describe("GET /treasury/dao-token", () => {
    beforeEach(() => {
      priceRepo = new FakePriceProvider();
      service = new TreasuryService(
        metricsRepo as unknown as TreasuryRepository,
        fakeProvider,
        priceRepo,
      );
      app = createTestApp(service);
    });

    it("should return 200 with calculated token treasury", async () => {
      const quantity = parseEther("100");
      const price = 50; // $50 per token

      metricsRepo.setTokenQuantities(new Map([[FIXED_TIMESTAMP, quantity]]));
      priceRepo.setPrices(new Map([[FIXED_TIMESTAMP, price]]));

      const res = await app.request("/treasury/dao-token?days=7d");
      expect(res.status).toBe(200);

      expect(await res.json()).toEqual({
        items: [{ date: FIXED_TIMESTAMP, value: 5000 }], // 100 * $50
        totalCount: 1,
      });
    });

    it("should return empty when price provider is not configured", async () => {
      const service = new TreasuryService(
        metricsRepo as unknown as TreasuryRepository,
        undefined,
        undefined,
      );
      const app = createTestApp(service);

      const res = await app.request("/treasury/dao-token?days=7d");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        items: [],
        totalCount: 0,
      });
    });
  });

  describe("GET /treasury/total", () => {
    beforeEach(() => {
      priceRepo = new FakePriceProvider();
      service = new TreasuryService(
        metricsRepo as unknown as TreasuryRepository,
        fakeProvider,
        priceRepo,
      );
      app = createTestApp(service);
    });

    it("should return sum of liquid and token treasury", async () => {
      // Liquid: $5,000,000
      fakeProvider.setData([{ date: FIXED_TIMESTAMP, value: 5 }]);

      // Token: 1000 tokens * $100 = $100,000
      const quantity = parseEther("1000");
      metricsRepo.setTokenQuantities(new Map([[FIXED_TIMESTAMP, quantity]]));
      priceRepo.setPrices(new Map([[FIXED_TIMESTAMP, 100]]));

      const res = await app.request("/treasury/total?days=7d");
      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        items: [{ date: FIXED_TIMESTAMP, value: 100000 + 5 }],
        totalCount: 1,
      });
    });

    it("should work when only liquid treasury has data", async () => {
      const expected = [{ date: FIXED_TIMESTAMP, value: 1000000 }];
      fakeProvider.setData(expected);
      metricsRepo.setTokenQuantities(new Map());
      priceRepo.setPrices(new Map());

      const res = await app.request("/treasury/total?days=7d");
      expect(res.status).toBe(200);

      expect(await res.json()).toEqual({
        items: expected,
        totalCount: 1,
      });
    });
  });
});
