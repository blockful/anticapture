import { parseEther } from "viem";
import { afterEach, beforeEach, vi, describe, it, expect } from "vitest";

import { TreasuryRepository } from "@/repositories/treasury";

import { TreasuryProvider } from "./providers";
import { TreasuryService } from "./treasury.service";
import { PriceProvider, LiquidTreasuryDataPoint } from "./types";

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

class FakeTreasuryRepository {
  private tokenQuantities: Map<number, bigint> = new Map();

  setTokenQuantities(quantities: Map<number, bigint>) {
    this.tokenQuantities = quantities;
  }

  async getTokenQuantities(
    _cutoffTimestamp: number,
  ): Promise<Map<number, bigint>> {
    return this.tokenQuantities;
  }

  async getLastTokenQuantityBeforeDate(
    _cutoffTimestamp: number,
  ): Promise<bigint | null> {
    return null;
  }
}

describe("TreasuryService", () => {
  const FIXED_DATE = new Date("2026-01-15T00:00:00Z");
  const FIXED_TIMESTAMP = Math.floor(FIXED_DATE.getTime() / 1000); // 1736937600
  const ONE_DAY = 86400;

  let liquidProvider: FakeTreasuryProvider;
  let priceProvider: FakePriceProvider;
  let metricRepo: FakeTreasuryRepository;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);

    liquidProvider = new FakeTreasuryProvider();
    priceProvider = new FakePriceProvider();
    metricRepo = new FakeTreasuryRepository();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getLiquidTreasury", () => {
    it("should return empty when provider is undefined", async () => {
      const service = new TreasuryService(
        metricRepo as unknown as TreasuryRepository,
        undefined,
        undefined,
      );

      const result = await service.getLiquidTreasury(7, "asc");

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should return empty when provider returns empty array", async () => {
      liquidProvider.setData([]);
      const service = new TreasuryService(
        metricRepo as unknown as TreasuryRepository,
        liquidProvider,
        undefined,
      );

      const result = await service.getLiquidTreasury(7, "asc");

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should return items sorted ascending", async () => {
      const expected = [
        { date: FIXED_TIMESTAMP - ONE_DAY * 2, value: 1000 },
        { date: FIXED_TIMESTAMP - ONE_DAY, value: 2000 },
        { date: FIXED_TIMESTAMP, value: 3000 },
      ];
      liquidProvider.setData(expected);

      const service = new TreasuryService(
        metricRepo as unknown as TreasuryRepository,
        liquidProvider,
        undefined,
      );

      const result = await service.getLiquidTreasury(7, "asc");

      expect(result).toEqual({
        items: expected,
        totalCount: expected.length,
      });
    });

    it("should return items sorted descending", async () => {
      const expected = [
        { date: FIXED_TIMESTAMP - ONE_DAY * 2, value: 1000 },
        { date: FIXED_TIMESTAMP - ONE_DAY, value: 2000 },
        { date: FIXED_TIMESTAMP, value: 3000 },
      ];
      liquidProvider.setData(expected);

      const service = new TreasuryService(
        metricRepo as unknown as TreasuryRepository,
        liquidProvider,
        undefined,
      );

      const result = await service.getLiquidTreasury(7, "desc");

      expect(result).toEqual({
        items: expected.sort((a, b) => b.date - a.date),
        totalCount: expected.length,
      });
    });
  });

  describe("getTokenTreasury", () => {
    it("should return empty when priceProvider is undefined", async () => {
      const service = new TreasuryService(
        metricRepo as unknown as TreasuryRepository,
        undefined,
        undefined,
      );

      const result = await service.getTokenTreasury(7, "asc", 18);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should return empty when repository and priceProvider return empty", async () => {
      metricRepo.setTokenQuantities(new Map());
      priceProvider.setPrices(new Map());

      const service = new TreasuryService(
        metricRepo as unknown as TreasuryRepository,
        undefined,
        priceProvider,
      );

      const result = await service.getTokenTreasury(7, "asc", 18);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should calculate value correctly with decimals", async () => {
      const quantity = 100;
      const price = 10; // $10 per token

      metricRepo.setTokenQuantities(
        new Map([[FIXED_TIMESTAMP, parseEther(quantity.toString())]]),
      );
      priceProvider.setPrices(new Map([[FIXED_TIMESTAMP, price]]));

      const service = new TreasuryService(
        metricRepo as unknown as TreasuryRepository,
        undefined,
        priceProvider,
      );

      const result = await service.getTokenTreasury(7, "asc", 18);

      expect(result).toEqual({
        items: [{ date: FIXED_TIMESTAMP, value: quantity * price }],
        totalCount: 1,
      });
    });

    it("should return items sorted ascending", async () => {
      const day1 = FIXED_TIMESTAMP - ONE_DAY * 2;
      const day2 = FIXED_TIMESTAMP - ONE_DAY;

      metricRepo.setTokenQuantities(
        new Map([
          [day1, parseEther("100")],
          [day2, parseEther("200")],
        ]),
      );
      priceProvider.setPrices(
        new Map([
          [day1, 10],
          [day2, 10],
        ]),
      );

      const service = new TreasuryService(
        metricRepo as unknown as TreasuryRepository,
        undefined,
        priceProvider,
      );

      const result = await service.getTokenTreasury(7, "asc", 18);

      expect(result).toEqual({
        items: [
          { date: day1, value: 1000 },
          { date: day2, value: 2000 },
          { date: FIXED_TIMESTAMP, value: 2000 }, // forward-filled value
        ],
        totalCount: 3,
      });
    });

    it("should return items sorted descending", async () => {
      const day1 = FIXED_TIMESTAMP - ONE_DAY * 2;
      const day2 = FIXED_TIMESTAMP - ONE_DAY;

      metricRepo.setTokenQuantities(
        new Map([
          [day1, parseEther("100")],
          [day2, parseEther("200")],
        ]),
      );
      priceProvider.setPrices(
        new Map([
          [day1, 10],
          [day2, 10],
        ]),
      );

      const service = new TreasuryService(
        metricRepo as unknown as TreasuryRepository,
        undefined,
        priceProvider,
      );

      const result = await service.getTokenTreasury(7, "desc", 18);

      expect(result).toEqual({
        items: [
          { date: FIXED_TIMESTAMP, value: 2000 }, // forward-filled value
          { date: day2, value: 2000 },
          { date: day1, value: 1000 },
        ],
        totalCount: 3,
      });
    });

    it("should return forward-filled values", async () => {
      const fourDaysAgo = FIXED_TIMESTAMP - ONE_DAY * 4;

      metricRepo.setTokenQuantities(
        new Map([[fourDaysAgo, parseEther("100")]]),
      );
      priceProvider.setPrices(new Map([[fourDaysAgo, 10]]));

      const service = new TreasuryService(
        metricRepo as unknown as TreasuryRepository,
        undefined,
        priceProvider,
      );

      const result = await service.getTokenTreasury(7, "asc", 18);

      expect(result).toEqual({
        items: [
          { date: fourDaysAgo, value: 1000 },
          /* forward-filled values */
          { date: FIXED_TIMESTAMP - ONE_DAY * 3, value: 1000 },
          { date: FIXED_TIMESTAMP - ONE_DAY * 2, value: 1000 },
          { date: FIXED_TIMESTAMP - ONE_DAY, value: 1000 },
          { date: FIXED_TIMESTAMP, value: 1000 },
          /* */
        ],
        totalCount: 5,
      });
    });
  });

  describe("getTotalTreasury", () => {
    let service: TreasuryService;

    beforeEach(() => {
      liquidProvider.setData([]);
      metricRepo.setTokenQuantities(new Map());
      priceProvider.setPrices(new Map());
      service = new TreasuryService(
        metricRepo as unknown as TreasuryRepository,
        liquidProvider,
        priceProvider,
      );
    });

    it("should return empty when both liquid and token are empty", async () => {
      const result = await service.getTotalTreasury(7, "asc", 18);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should sum liquid and token treasury correctly", async () => {
      const dayTimestamp = FIXED_TIMESTAMP;

      // Liquid: $5000
      liquidProvider.setData([{ date: dayTimestamp, value: 5000 }]);

      // Token: 100 tokens * $30 = $3000
      metricRepo.setTokenQuantities(
        new Map([[dayTimestamp, parseEther("100")]]),
      );
      priceProvider.setPrices(new Map([[dayTimestamp, 30]]));

      const result = await service.getTotalTreasury(7, "asc", 18);

      expect(result).toEqual({
        items: [{ date: FIXED_TIMESTAMP, value: 8000 }],
        totalCount: 1,
      });
    });

    it("should work when only liquid has data", async () => {
      liquidProvider.setData([{ date: FIXED_TIMESTAMP, value: 5000 }]);

      const result = await service.getTotalTreasury(7, "asc", 18);

      expect(result).toEqual({
        items: [{ date: FIXED_TIMESTAMP, value: 5000 }],
        totalCount: 1,
      });
    });

    it("should work when only token has data", async () => {
      const dayTimestamp = FIXED_TIMESTAMP;

      liquidProvider.setData([]);
      metricRepo.setTokenQuantities(
        new Map([[dayTimestamp, parseEther("100")]]),
      );
      priceProvider.setPrices(new Map([[dayTimestamp, 25]]));

      const service = new TreasuryService(
        metricRepo as unknown as TreasuryRepository,
        undefined, // no liquid provider
        priceProvider,
      );

      const result = await service.getTotalTreasury(7, "asc", 18);

      expect(result).toEqual({
        items: [{ date: FIXED_TIMESTAMP, value: 2500 }],
        totalCount: 1,
      });
    });
  });
});
