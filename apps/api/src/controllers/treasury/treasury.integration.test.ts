import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { testClient } from "hono/testing";
import { treasury } from "./index";
import { TreasuryService } from "@/services/treasury";
import { TreasuryProvider, LiquidTreasuryDataPoint, PriceProvider } from "@/services/treasury";
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

  describe("GET /treasury/liquid", () => {
    it("should return 200 with valid response structure", async () => {
      fakeProvider.setData([
        { date: FIXED_TIMESTAMP - ONE_DAY, liquidTreasury: 1000000 },
        { date: FIXED_TIMESTAMP, liquidTreasury: 1100000 },
      ]);

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        fakeProvider,
        undefined,
      );
      const app = createTestApp(service);
      const client = testClient(app) as any;

      const res = await client["treasury"]["liquid"].$get({
        query: { days: "7d", order: "asc" },
      });

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("totalCount");
      expect(Array.isArray(data.items)).toBe(true);
      expect(data.totalCount).toBe(data.items.length);
    });

    it("should return items with correct shape (date and value)", async () => {
      fakeProvider.setData([
        { date: FIXED_TIMESTAMP, liquidTreasury: 5000000 },
      ]);

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        fakeProvider,
        undefined,
      );
      const app = createTestApp(service);
      const client = testClient(app) as any;

      const res = await client["treasury"]["liquid"].$get({
        query: { days: "7d" },
      });

      const data = await res.json();
      const item = data.items[0];

      expect(item).toHaveProperty("date");
      expect(item).toHaveProperty("value");
      expect(typeof item?.date).toBe("number");
      expect(typeof item?.value).toBe("number");
    });

    it("should use default values when query params are omitted", async () => {
      fakeProvider.setData([
        { date: FIXED_TIMESTAMP, liquidTreasury: 1000000 },
      ]);

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        fakeProvider,
        undefined,
      );
      const app = createTestApp(service);
      const client = testClient(app) as any;

      const res = await client["treasury"]["liquid"].$get({
        query: {},
      });

      expect(res.status).toBe(200);
    });

    it("should return empty items when no data available", async () => {
      fakeProvider.setData([]);

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        fakeProvider,
        undefined,
      );
      const app = createTestApp(service);
      const client = testClient(app) as any;

      const res = await client["treasury"]["liquid"].$get({
        query: { days: "7d" },
      });

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.items).toHaveLength(0);
      expect(data.totalCount).toBe(0);
    });

    it("should respect order parameter", async () => {
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
      const app = createTestApp(service);
      const client = testClient(app) as any;

      const resAsc = await client["treasury"]["liquid"].$get({
        query: { days: "7d", order: "asc" },
      });
      const dataAsc = await resAsc.json();

      const resDesc = await client["treasury"]["liquid"].$get({
        query: { days: "7d", order: "desc" },
      });
      const dataDesc = await resDesc.json();

      expect(dataAsc.items[0]?.date).toBeLessThan(dataAsc.items[dataAsc.items.length - 1]?.date ?? 0);
      expect(dataDesc.items[0]?.date).toBeGreaterThan(dataDesc.items[dataDesc.items.length - 1]?.date ?? 0);
    });
  });

  describe("GET /treasury/dao-token", () => {
    it("should return 200 with calculated token treasury", async () => {
      const quantity = 100n * 10n ** 18n; // 100 tokens
      const price = 50; // $50 per token

      fakeRepository.setTokenQuantities(new Map([[FIXED_TIMESTAMP, quantity]]));
      fakePriceProvider.setPrices(new Map([[FIXED_TIMESTAMP, price]]));

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        undefined,
        fakePriceProvider,
      );
      const app = createTestApp(service, 18);
      const client = testClient(app) as any;

      const res = await client["treasury"]["dao-token"].$get({
        query: { days: "7d" },
      });

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty("items");
      expect(data).toHaveProperty("totalCount");

      const itemWithValue = data.items.find((item: { value: number }) => item.value > 0);
      expect(itemWithValue?.value).toBe(5000); // 100 * $50
    });

    it("should return empty when price provider is not configured", async () => {
      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        undefined,
        undefined,
      );
      const app = createTestApp(service);
      const client = testClient(app) as any;

      const res = await client["treasury"]["dao-token"].$get({
        query: { days: "7d" },
      });

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.items).toHaveLength(0);
    });
  });

  describe("GET /treasury/total", () => {
    it("should return sum of liquid and token treasury", async () => {
      // Liquid: $5,000,000
      fakeProvider.setData([
        { date: FIXED_TIMESTAMP, liquidTreasury: 5000000 },
      ]);

      // Token: 1000 tokens * $100 = $100,000
      const quantity = 1000n * 10n ** 18n;
      fakeRepository.setTokenQuantities(new Map([[FIXED_TIMESTAMP, quantity]]));
      fakePriceProvider.setPrices(new Map([[FIXED_TIMESTAMP, 100]]));

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        fakeProvider,
        fakePriceProvider,
      );
      const app = createTestApp(service, 18);
      const client = testClient(app) as any;

      const res = await client["treasury"]["total"].$get({
        query: { days: "7d" },
      });

      expect(res.status).toBe(200);

      const data = await res.json();
      const todayItem = data.items.find((item: { date: number }) => item.date === FIXED_TIMESTAMP);

      // Total = $5,000,000 + $100,000 = $5,100,000
      expect(todayItem?.value).toBe(5100000);
    });

    it("should work when only liquid treasury has data", async () => {
      fakeProvider.setData([
        { date: FIXED_TIMESTAMP, liquidTreasury: 1000000 },
      ]);
      fakeRepository.setTokenQuantities(new Map());
      fakePriceProvider.setPrices(new Map());

      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        fakeProvider,
        fakePriceProvider,
      );
      const app = createTestApp(service);
      const client = testClient(app) as any;

      const res = await client["treasury"]["total"].$get({
        query: { days: "7d" },
      });

      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data.items.length).toBeGreaterThan(0);
    });
  });

  describe("Query Parameter Validation", () => {
    it("should accept all valid days options", async () => {
      fakeProvider.setData([]);
      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        fakeProvider,
        undefined,
      );
      const app = createTestApp(service);
      const client = testClient(app) as any;

      const validDays = ["7d", "30d", "90d", "180d", "365d"] as const;

      for (const days of validDays) {
        const res = await client["treasury"]["liquid"].$get({
          query: { days },
        });
        expect(res.status).toBe(200);
      }
    });

    it("should accept both asc and desc order", async () => {
      fakeProvider.setData([]);
      const service = new TreasuryService(
        fakeRepository as unknown as TreasuryRepository,
        fakeProvider,
        undefined,
      );
      const app = createTestApp(service);
      const client = testClient(app) as any;

      const resAsc = await client["treasury"]["liquid"].$get({
        query: { days: "7d", order: "asc" },
      });
      const resDesc = await client["treasury"]["liquid"].$get({
        query: { days: "7d", order: "desc" },
      });

      expect(resAsc.status).toBe(200);
      expect(resDesc.status).toBe(200);
    });
  });
});
