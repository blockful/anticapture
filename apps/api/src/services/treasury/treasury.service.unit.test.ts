import { parseEther } from "viem";
import { afterEach, beforeEach, vi, describe, it, expect } from "vitest";

import { captureDegradedUpstream } from "@/lib/degraded-upstream.test-support";
import { UpstreamUnavailableError } from "@/lib/upstream-error";

import { TreasuryProvider } from "./providers";
import { ITreasuryRepository, TreasuryService } from "./treasury.service";
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
  private failure: unknown;

  setPrices(prices: Map<number, number>) {
    this.prices = prices;
  }

  /** Makes the next lookup reject, to exercise the degraded path. */
  failWith(error: unknown) {
    this.failure = error;
  }

  async getHistoricalPricesMap(_days: number) {
    if (this.failure) throw this.failure;
    return { data: this.prices, degraded: false };
  }
}

const EMPTY_RESULT = { items: [], totalCount: 0 };

class FakeTreasuryRepository implements ITreasuryRepository {
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
      const service = new TreasuryService(metricRepo, undefined, undefined);

      const { data: result } = await service.getLiquidTreasury(7, "asc");

      expect(result).toEqual(EMPTY_RESULT);
    });

    it("should return empty when provider returns empty array", async () => {
      liquidProvider.setData([]);
      const service = new TreasuryService(
        metricRepo,
        liquidProvider,
        undefined,
      );

      const { data: result } = await service.getLiquidTreasury(7, "asc");

      expect(result).toEqual(EMPTY_RESULT);
    });

    it("should return items sorted ascending", async () => {
      const expected = [
        { date: FIXED_TIMESTAMP - ONE_DAY * 2, value: 1000 },
        { date: FIXED_TIMESTAMP - ONE_DAY, value: 2000 },
        { date: FIXED_TIMESTAMP, value: 3000 },
      ];
      liquidProvider.setData(expected);

      const service = new TreasuryService(
        metricRepo,
        liquidProvider,
        undefined,
      );

      const { data: result } = await service.getLiquidTreasury(7, "asc");

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
        metricRepo,
        liquidProvider,
        undefined,
      );

      const { data: result } = await service.getLiquidTreasury(7, "desc");

      expect(result).toEqual({
        items: expected.sort((a, b) => b.date - a.date),
        totalCount: expected.length,
      });
    });
  });

  describe("getLiquidTreasury degradation", () => {
    it("degrades to empty when the treasury provider is unavailable", async () => {
      const failing: TreasuryProvider = {
        fetchTreasury: async () => {
          throw new UpstreamUnavailableError("defillama", "DefiLlama down");
        },
      };
      const degraded = captureDegradedUpstream();

      const service = new TreasuryService(metricRepo, failing, priceProvider);
      const { data: result, degraded: isDegraded } =
        await service.getLiquidTreasury(7, "asc");

      expect(isDegraded).toBe(true);
      expect(result).toEqual({ items: [], totalCount: 0 });
      expect(degraded.recorded()).toEqual([
        {
          upstream: "defillama",
          resource: "treasury",
          mode: "empty",
          reason: "unavailable",
        },
      ]);
    });

    it("propagates a failure that is not the provider's", async () => {
      const ourBug = new Error("transform blew up");
      const failing: TreasuryProvider = {
        fetchTreasury: async () => {
          throw ourBug;
        },
      };

      const service = new TreasuryService(metricRepo, failing, priceProvider);

      await expect(service.getLiquidTreasury(7, "asc")).rejects.toBe(ourBug);
    });
  });

  describe("getTokenTreasury", () => {
    it("should return empty when priceProvider is undefined", async () => {
      const service = new TreasuryService(metricRepo, undefined, undefined);

      const { data: result } = await service.getTokenTreasury(7, "asc", 18);

      expect(result).toEqual(EMPTY_RESULT);
    });

    // Without this the gateway counts the 5xx against the DAO circuit breaker,
    // which is exactly what this route is supposed to survive.
    it("degrades to unpriced points when CoinGecko is unavailable", async () => {
      metricRepo.setTokenQuantities(new Map([[1700000000, 10n ** 18n]]));
      priceProvider.failWith(
        new UpstreamUnavailableError("coingecko", "CoinGecko down"),
      );
      const degraded = captureDegradedUpstream();

      const service = new TreasuryService(metricRepo, undefined, priceProvider);
      const { data: result, degraded: isDegraded } =
        await service.getTokenTreasury(7, "asc", 18);

      expect(isDegraded).toBe(true);
      expect(result.items.every((item) => item.value === 0)).toBe(true);
      expect(degraded.recorded()).toEqual([
        {
          upstream: "coingecko",
          resource: "treasury",
          mode: "empty",
          reason: "unavailable",
        },
      ]);
    });

    // Valuing every point at zero would read as the treasury crashing to $0.
    it("serves no points rather than zero-valued ones when prices are missing", async () => {
      metricRepo.setTokenQuantities(new Map([[1700000000, 10n ** 18n]]));
      priceProvider.failWith(
        new UpstreamUnavailableError("coingecko", "CoinGecko down"),
      );

      const service = new TreasuryService(metricRepo, undefined, priceProvider);
      const { data: result, degraded } = await service.getTokenTreasury(
        7,
        "asc",
        18,
      );

      expect(degraded).toBe(true);
      expect(result).toEqual({ items: [], totalCount: 0 });
    });

    it("does not degrade when the failure is our own", async () => {
      metricRepo.setTokenQuantities(new Map([[1700000000, 10n ** 18n]]));
      const ourBug = new Error("connection terminated unexpectedly");
      priceProvider.failWith(ourBug);
      const degraded = captureDegradedUpstream();

      const service = new TreasuryService(metricRepo, undefined, priceProvider);

      await expect(service.getTokenTreasury(7, "asc", 18)).rejects.toBe(ourBug);
      expect(degraded.recorded()).toEqual([]);
    });

    it("should return empty when repository and priceProvider return empty", async () => {
      metricRepo.setTokenQuantities(new Map());
      priceProvider.setPrices(new Map());

      const service = new TreasuryService(metricRepo, undefined, priceProvider);

      const { data: result } = await service.getTokenTreasury(7, "asc", 18);

      expect(result).toEqual(EMPTY_RESULT);
    });

    it("should calculate value correctly with decimals", async () => {
      const quantity = 100;
      const price = 10; // $10 per token

      metricRepo.setTokenQuantities(
        new Map([[FIXED_TIMESTAMP, parseEther(quantity.toString())]]),
      );
      priceProvider.setPrices(new Map([[FIXED_TIMESTAMP, price]]));

      const service = new TreasuryService(metricRepo, undefined, priceProvider);

      const { data: result } = await service.getTokenTreasury(7, "asc", 18);

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

      const service = new TreasuryService(metricRepo, undefined, priceProvider);

      const { data: result } = await service.getTokenTreasury(7, "asc", 18);

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

      const service = new TreasuryService(metricRepo, undefined, priceProvider);

      const { data: result } = await service.getTokenTreasury(7, "desc", 18);

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

      const service = new TreasuryService(metricRepo, undefined, priceProvider);

      const { data: result } = await service.getTokenTreasury(7, "asc", 18);

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
      service = new TreasuryService(metricRepo, liquidProvider, priceProvider);
    });

    it("should return empty when both liquid and token are empty", async () => {
      const { data: result } = await service.getTotalTreasury(7, "asc", 18);

      expect(result).toEqual(EMPTY_RESULT);
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

      const { data: result } = await service.getTotalTreasury(7, "asc", 18);

      expect(result).toEqual({
        items: [{ date: FIXED_TIMESTAMP, value: 8000 }],
        totalCount: 1,
      });
    });

    it("should work when only liquid has data", async () => {
      liquidProvider.setData([{ date: FIXED_TIMESTAMP, value: 5000 }]);

      const { data: result } = await service.getTotalTreasury(7, "asc", 18);

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
        metricRepo,
        undefined, // no liquid provider
        priceProvider,
      );

      const { data: result } = await service.getTotalTreasury(7, "asc", 18);

      expect(result).toEqual({
        items: [{ date: FIXED_TIMESTAMP, value: 2500 }],
        totalCount: 1,
      });
    });
  });
});
