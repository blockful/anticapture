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
    db = drizzle(client as any, { schema });

    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(daoMetricsDayBucket);
    repository = new TreasuryRepository(db);
  });

  describe("getTokenQuantities", () => {
    it("returns correct Map with timestamp keys and close values", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetricRow({ date: 1000n, close: 500n }),
        createMetricRow({ date: 2000n, close: 700n, tokenId: "ENS-token-2" }),
      ]);

      const result = await repository.getTokenQuantities(0);

      expect(result.size).toBe(2);
      expect(result.get(1000 * 1000)).toBe(500n); // Timestamp in milliseconds
      expect(result.get(2000 * 1000)).toBe(700n); // Timestamp in milliseconds
    });

    it("filters by cutoff timestamp (date >= cutoff)", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetricRow({ date: 100n, close: 10n }),
        createMetricRow({ date: 200n, close: 20n, tokenId: "ENS-token-2" }),
        createMetricRow({ date: 300n, close: 30n, tokenId: "ENS-token-3" }),
      ]);

      const result = await repository.getTokenQuantities(200);

      expect(result.size).toBe(2);
      expect(result.has(100 * 1000)).toBe(false);
      expect(result.get(200 * 1000)).toBe(20n);
      expect(result.get(300 * 1000)).toBe(30n);
    });

    it("filters by metricType (only TREASURY rows)", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetricRow({ date: 100n, close: 10n }),
        createMetricRow({
          date: 100n,
          close: 99n,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
        }),
      ]);

      const result = await repository.getTokenQuantities(0);

      expect(result.size).toBe(1);
      expect(result.get(100 * 1000)).toBe(10n);
    });

    it("returns results in ascending date order regardless of insertion order", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetricRow({ date: 300n, close: 30n }),
        createMetricRow({ date: 100n, close: 10n, tokenId: "ENS-token-2" }),
        createMetricRow({ date: 200n, close: 20n, tokenId: "ENS-token-3" }),
      ]);

      const result = await repository.getTokenQuantities(0);
      const keys = [...result.keys()];

      expect(keys).toEqual([100 * 1000, 200 * 1000, 300 * 1000]);
    });

    it("returns empty Map when no rows exist", async () => {
      const result = await repository.getTokenQuantities(0);

      expect(result.size).toBe(0);
    });

    it("returns empty Map when no rows match the cutoff", async () => {
      await db
        .insert(daoMetricsDayBucket)
        .values([createMetricRow({ date: 100n, close: 10n })]);

      const result = await repository.getTokenQuantities(999);

      expect(result.size).toBe(0);
    });

    it("boundary: cutoff equals exact date (inclusive, gte)", async () => {
      await db
        .insert(daoMetricsDayBucket)
        .values([createMetricRow({ date: 500n, close: 50n })]);

      const result = await repository.getTokenQuantities(500);

      expect(result.size).toBe(1);
      expect(result.get(500 * 1000)).toBe(50n);
    });
  });

  describe("getLastTokenQuantityBeforeDate", () => {

    it("returns null when no rows exist", async () => {
      const result = await repository.getLastTokenQuantityBeforeDate(999);

      expect(result).toBeNull();
    });

    it("returns null when no rows are before cutoff", async () => {
      await db
        .insert(daoMetricsDayBucket)
        .values([createMetricRow({ date: 500n, close: 50n })]);

      const result = await repository.getLastTokenQuantityBeforeDate(100);

      expect(result).toBeNull();
    });

    it("boundary: cutoff equals exact date (inclusive, lte)", async () => {
      await db
        .insert(daoMetricsDayBucket)
        .values([createMetricRow({ date: 500n, close: 50n })]);

      const result = await repository.getLastTokenQuantityBeforeDate(500);

      expect(result).toBe(50n);
    });

    it("returns most recent when multiple rows exist before cutoff", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetricRow({ date: 100n, close: 10n }),
        createMetricRow({ date: 200n, close: 20n, tokenId: "ENS-token-2" }),
        createMetricRow({ date: 300n, close: 30n, tokenId: "ENS-token-3" }),
      ]);

      const result = await repository.getLastTokenQuantityBeforeDate(400);

      expect(result).toBe(30n);
    });

    it("filters by metricType (only TREASURY)", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetricRow({
          date: 200n,
          close: 99n,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
        }),
        createMetricRow({ date: 100n, close: 10n }),
      ]);

      const result = await repository.getLastTokenQuantityBeforeDate(300);

      expect(result).toBe(10n);
    });
  });
});
