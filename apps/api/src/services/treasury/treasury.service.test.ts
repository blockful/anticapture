import { afterEach, beforeEach, vi, describe, it, expect } from "vitest";
import { TreasuryService } from "./treasury.service";
import { TreasuryProvider } from "./providers";
import { PriceProvider, LiquidTreasuryDataPoint } from "./types";
import { TreasuryRepository } from "@/repositories/treasury";

/**
 * Fakes for dependency injection
 */
class FakeTreasuryProvider implements TreasuryProvider {
  private data: LiquidTreasuryDataPoint[] = [];

  setData(data: LiquidTreasuryDataPoint[]) {
    this.data = data;
  }

  async fetchTreasury(_cutoffTimestamp: number): Promise<LiquidTreasuryDataPoint[]> {
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
  private lastKnownQuantity: bigint | null = null;

  setTokenQuantities(quantities: Map<number, bigint>) {
    this.tokenQuantities = quantities;
  }

  setLastKnownQuantity(quantity: bigint | null) {
    this.lastKnownQuantity = quantity;
  }

  async getTokenQuantities(_cutoffTimestamp: number): Promise<Map<number, bigint>> {
    return this.tokenQuantities;
  }

  async getLastTokenQuantityBeforeDate(_cutoffTimestamp: number): Promise<bigint | null> {
    return this.lastKnownQuantity;
  }
}

describe("TreasuryService", () => {
  const FIXED_DATE = new Date("2026-01-15T00:00:00Z");
  const FIXED_TIMESTAMP = Math.floor(FIXED_DATE.getTime() / 1000); // 1736937600
  const ONE_DAY = 86400;

  let fakeProvider: FakeTreasuryProvider;
  let fakePriceProvider: FakePriceProvider;
  let fakeRepository: FakeTreasuryRepository;

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);

    fakeProvider = new FakeTreasuryProvider();
    fakePriceProvider = new FakePriceProvider();
    fakeRepository = new FakeTreasuryRepository();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("getLiquidTreasury", () => {
    it("should return empty when provider is undefined", async () => {
      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        undefined,
        undefined,
      );

      const result = await service.getLiquidTreasury(7, "asc");

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should return empty when provider returns empty array", async () => {
      fakeProvider.setData([]);
      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        fakeProvider,
        undefined,
      );

      const result = await service.getLiquidTreasury(7, "asc");

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should return items sorted ascending", async () => {
      const day1 = FIXED_TIMESTAMP - ONE_DAY * 2;
      const day2 = FIXED_TIMESTAMP - ONE_DAY;
      const day3 = FIXED_TIMESTAMP;

      fakeProvider.setData([
        { date: day1, liquidTreasury: 1000 },
        { date: day2, liquidTreasury: 2000 },
        { date: day3, liquidTreasury: 3000 },
      ]);

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        fakeProvider,
        undefined,
      );

      const result = await service.getLiquidTreasury(7, "asc");

      expect(result.items.length).toBeGreaterThanOrEqual(3);
      expect(result.items[0]?.date).toBeLessThan(result.items[1]?.date ?? 0);
      expect(result.totalCount).toBe(result.items.length);
    });

    it("should return items sorted descending", async () => {
      const day1 = FIXED_TIMESTAMP - ONE_DAY * 2;
      const day2 = FIXED_TIMESTAMP - ONE_DAY;
      const day3 = FIXED_TIMESTAMP;

      fakeProvider.setData([
        { date: day1, liquidTreasury: 1000 },
        { date: day2, liquidTreasury: 2000 },
        { date: day3, liquidTreasury: 3000 },
      ]);

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        fakeProvider,
        undefined,
      );

      const result = await service.getLiquidTreasury(7, "desc");

      expect(result.items.length).toBeGreaterThanOrEqual(3);
      expect(result.items[0]?.date).toBeGreaterThan(result.items[1]?.date ?? 0);
    });
  });

  describe("getTokenTreasury", () => {
    it("should return empty when priceProvider is undefined", async () => {
      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        undefined,
        undefined,
      );

      const result = await service.getTokenTreasury(7, "asc", 18);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should return empty when repository and priceProvider return empty", async () => {
      fakeRepository.setTokenQuantities(new Map());
      fakePriceProvider.setPrices(new Map());

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        undefined,
        fakePriceProvider,
      );

      const result = await service.getTokenTreasury(7, "asc", 18);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should calculate value correctly with decimals", async () => {
      // Both repository and priceProvider return timestamps in seconds (normalized to midnight)
      const dayTimestamp = FIXED_TIMESTAMP;

      // 100 tokens with 18 decimals = 100 * 10^18
      const quantity = 100n * 10n ** 18n;
      const price = 10; // $10 per token

      fakeRepository.setTokenQuantities(new Map([[dayTimestamp, quantity]]));
      fakePriceProvider.setPrices(new Map([[dayTimestamp, price]]));

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        undefined,
        fakePriceProvider,
      );

      const result = await service.getTokenTreasury(7, "asc", 18);

      // 100 tokens * $10 = $1000
      const todayItem = result.items.find((item) => item.value > 0);
      expect(todayItem?.value).toBe(1000);
    });

    it("should return items sorted ascending", async () => {
      const day1 = FIXED_TIMESTAMP - ONE_DAY * 2;
      const day2 = FIXED_TIMESTAMP - ONE_DAY;

      fakeRepository.setTokenQuantities(
        new Map([
          [day1, 100n * 10n ** 18n],
          [day2, 200n * 10n ** 18n],
        ]),
      );
      fakePriceProvider.setPrices(
        new Map([
          [day1, 10],
          [day2, 10],
        ]),
      );

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        undefined,
        fakePriceProvider,
      );

      const result = await service.getTokenTreasury(7, "asc", 18);

      expect(result.items.length).toBeGreaterThanOrEqual(2);
      expect(result.items[0]?.date).toBeLessThan(result.items[1]?.date ?? 0);
    });

    it("should return items sorted descending", async () => {
      const day1 = FIXED_TIMESTAMP - ONE_DAY * 2;
      const day2 = FIXED_TIMESTAMP - ONE_DAY;

      fakeRepository.setTokenQuantities(
        new Map([
          [day1, 100n * 10n ** 18n],
          [day2, 200n * 10n ** 18n],
        ]),
      );
      fakePriceProvider.setPrices(
        new Map([
          [day1, 10],
          [day2, 10],
        ]),
      );

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        undefined,
        fakePriceProvider,
      );

      const result = await service.getTokenTreasury(7, "desc", 18);

      expect(result.items.length).toBeGreaterThanOrEqual(2);
      expect(result.items[0]?.date).toBeGreaterThan(result.items[1]?.date ?? 0);
    });

    it("should use lastKnownQuantity from repository", async () => {
      const dayTimestamp = FIXED_TIMESTAMP;

      // No quantities in range, but has last known value
      fakeRepository.setTokenQuantities(new Map());
      fakeRepository.setLastKnownQuantity(50n * 10n ** 18n); // 50 tokens
      fakePriceProvider.setPrices(new Map([[dayTimestamp, 20]])); // $20 per token

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        undefined,
        fakePriceProvider,
      );

      const result = await service.getTokenTreasury(7, "asc", 18);

      // Should use last known quantity: 50 * $20 = $1000
      const itemWithValue = result.items.find((item) => item.value > 0);
      expect(itemWithValue?.value).toBe(1000);
    });
  });

  describe("getTotalTreasury", () => {
    it("should return empty when both liquid and token are empty", async () => {
      fakeProvider.setData([]);
      fakeRepository.setTokenQuantities(new Map());
      fakePriceProvider.setPrices(new Map());

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        fakeProvider,
        fakePriceProvider,
      );

      const result = await service.getTotalTreasury(7, "asc", 18);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
    });

    it("should sum liquid and token treasury correctly", async () => {
      const dayTimestamp = FIXED_TIMESTAMP;

      // Liquid: $5000
      fakeProvider.setData([{ date: dayTimestamp, liquidTreasury: 5000 }]);

      // Token: 100 tokens * $30 = $3000
      fakeRepository.setTokenQuantities(new Map([[dayTimestamp, 100n * 10n ** 18n]]));
      fakePriceProvider.setPrices(new Map([[dayTimestamp, 30]]));

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        fakeProvider,
        fakePriceProvider,
      );

      const result = await service.getTotalTreasury(7, "asc", 18);

      // Total = $5000 + $3000 = $8000
      const todayItem = result.items.find((item) => item.date === dayTimestamp);
      expect(todayItem?.value).toBe(8000);
    });

    it("should work when only liquid has data", async () => {
      fakeProvider.setData([{ date: FIXED_TIMESTAMP, liquidTreasury: 5000 }]);
      fakeRepository.setTokenQuantities(new Map());
      fakePriceProvider.setPrices(new Map());

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        fakeProvider,
        fakePriceProvider,
      );

      const result = await service.getTotalTreasury(7, "asc", 18);

      expect(result.items.length).toBeGreaterThan(0);
      const todayItem = result.items.find((item) => item.date === FIXED_TIMESTAMP);
      expect(todayItem?.value).toBe(5000);
    });

    it("should work when only token has data", async () => {
      const dayTimestamp = FIXED_TIMESTAMP;

      fakeProvider.setData([]);
      fakeRepository.setTokenQuantities(new Map([[dayTimestamp, 100n * 10n ** 18n]]));
      fakePriceProvider.setPrices(new Map([[dayTimestamp, 25]]));

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        undefined, // no liquid provider
        fakePriceProvider,
      );

      const result = await service.getTotalTreasury(7, "asc", 18);

      expect(result.items.length).toBeGreaterThan(0);
      // 100 tokens * $25 = $2500
      const itemWithValue = result.items.find((item) => item.value > 0);
      expect(itemWithValue?.value).toBe(2500);
    });
  });
});
