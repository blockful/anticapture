# API Test Samples

Reference samples for writing tests in the API app. Follow the conventions in the root [testing rules](../../.claude/rules/testing.md).

---

## Service Test (Unit)

Services contain business logic. Use **fakes** for all dependencies (repositories, providers). No database or network access.

```ts
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
  const FIXED_TIMESTAMP = Math.floor(FIXED_DATE.getTime() / 1000);
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
    it("should return items sorted ascending", async () => {
      const expected = [
        { date: FIXED_TIMESTAMP - ONE_DAY * 2, value: 1000 },
        { date: FIXED_TIMESTAMP - ONE_DAY, value: 2000 },
        { date: FIXED_TIMESTAMP, value: 3000 },
      ];
      liquidProvider.setData(expected);

      const service = new TreasuryService(
        metricRepo as TreasuryRepository,
        liquidProvider,
        undefined,
      );

      const result = await service.getLiquidTreasury(7, "asc");

      expect(result).toEqual({
        items: expected,
        totalCount: expected.length,
      });
    });
  });
});
```

**Key patterns:**

- Fake classes implement the same interface as the real dependency
- Fakes expose `setX()` methods to configure return values per test
- `vi.useFakeTimers()` + `vi.setSystemTime()` for deterministic dates
- No mocks unless verifying a call IS the behavior

---

## Repository Test (Integration)

Repositories interact with the database. Use **PGlite** (in-memory PostgreSQL) with **Drizzle ORM** for real SQL execution.

```ts
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { pushSchema } from "drizzle-kit/api";
import * as schema from "@/database/schema";
import { daoMetricsDayBucket } from "@/database/schema";
import { MetricTypesEnum } from "@/lib/constants";
import { TreasuryRepository } from ".";

type DaoMetricInsert = typeof daoMetricsDayBucket.$inferInsert;

const createMetricRow = (
  overrides: Partial<DaoMetricInsert> = {},
): DaoMetricInsert => ({
  date: 1600041600n,
  daoId: "ENS",
  tokenId: "ENS-token",
  metricType: MetricTypesEnum.TREASURY,
  open: 0n,
  close: 1000n,
  low: 0n,
  high: 1000n,
  average: 500n,
  volume: 100n,
  count: 1,
  lastUpdate: 1600041600n,
  ...overrides,
});

describe("TreasuryRepository - Integration", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: TreasuryRepository;

  beforeAll(async () => {
    // pushSchema uses JSON.stringify internally, which doesn't handle BigInt
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new TreasuryRepository(db);

    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(daoMetricsDayBucket);
  });

  describe("getTokenQuantities", () => {
    it("returns correct Map with timestamp keys and close values", async () => {
      await db
        .insert(daoMetricsDayBucket)
        .values([
          createMetricRow({ date: 1000n, close: 500n }),
          createMetricRow({ date: 2000n, close: 700n, tokenId: "ENS-token-2" }),
        ]);

      const result = await repository.getTokenQuantities(0);

      expect(result.size).toBe(2);
      expect(result.get(1000 * 1000)).toBe(500n);
      expect(result.get(2000 * 1000)).toBe(700n);
    });
  });

  describe("getLastTokenQuantityBeforeDate", () => {
    it("returns null when no rows exist", async () => {
      const result = await repository.getLastTokenQuantityBeforeDate(999);

      expect(result).toBeNull();
    });

    it("returns most recent when multiple rows exist before cutoff", async () => {
      await db
        .insert(daoMetricsDayBucket)
        .values([
          createMetricRow({ date: 100n, close: 10n }),
          createMetricRow({ date: 200n, close: 20n, tokenId: "ENS-token-2" }),
          createMetricRow({ date: 300n, close: 30n, tokenId: "ENS-token-3" }),
        ]);

      const result = await repository.getLastTokenQuantityBeforeDate(400);

      expect(result).toBe(30n);
    });
  });
});
```

**Key patterns:**

- `PGlite` provides an in-memory PostgreSQL instance (no Docker needed)
- `pushSchema` applies the Drizzle schema automatically
- `beforeEach` cleans the table to ensure test isolation
- Factory function `createXRow()` with sensible defaults and overrides
- Test boundary conditions (exact cutoff, empty tables, ordering)

---

## Controller Test (Integration)

Controllers wire routes to services. Use **fakes injected into the real service** and test via HTTP with `app.request()`.

```ts
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
        metricsRepo as TreasuryRepository,
        fakeProvider,
        undefined,
      );
      app = createTestApp(service);
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
});
```

**Key patterns:**

- Create a real Hono app with `createTestApp()` and inject a real service with fake dependencies
- Use `app.request()` to send HTTP requests (no test server needed)
- Assert on HTTP status codes and JSON response bodies
- Test query parameter handling gathered from the given mapper schema
- Controller tests verify the full route -> service -> response pipeline
