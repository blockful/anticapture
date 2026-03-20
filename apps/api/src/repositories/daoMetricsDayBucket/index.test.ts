import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { daoMetricsDayBucket } from "@/database/schema";
import { MetricTypesEnum } from "@/lib/constants";
import { DaoMetricsDayBucketRepository } from "./index";

type MetricInsert = typeof daoMetricsDayBucket.$inferInsert;

const createMetric = (overrides: Partial<MetricInsert> = {}): MetricInsert => ({
  date: 1700000000n,
  daoId: "UNI",
  tokenId: "uni",
  metricType: MetricTypesEnum.DELEGATED_SUPPLY,
  open: 0n,
  close: 0n,
  low: 0n,
  high: 1000n,
  average: 0n,
  volume: 0n,
  count: 1,
  lastUpdate: 1700000000n,
  ...overrides,
});

describe("DaoMetricsDayBucketRepository", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: DaoMetricsDayBucketRepository;

  beforeAll(async () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new DaoMetricsDayBucketRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(daoMetricsDayBucket);
  });

  describe("getMetricsByDateRange", () => {
    it("returns empty array when no data exists", async () => {
      const result = await repository.getMetricsByDateRange({
        metricTypes: [MetricTypesEnum.DELEGATED_SUPPLY],
        orderDirection: "asc",
        limit: 10,
      });

      expect(result).toHaveLength(0);
    });

    it("returns rows for the specified metric types", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetric({
          date: 1700000000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        }),
        createMetric({
          date: 1700000000n,
          tokenId: "uni-cex",
          metricType: MetricTypesEnum.CEX_SUPPLY,
        }),
      ]);

      const result = await repository.getMetricsByDateRange({
        metricTypes: [MetricTypesEnum.DELEGATED_SUPPLY],
        orderDirection: "asc",
        limit: 10,
      });

      expect(result).toHaveLength(1);
      expect(result[0]?.metricType).toBe(MetricTypesEnum.DELEGATED_SUPPLY);
    });

    it("filters by startDate inclusive", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetric({
          date: 1699900000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        }),
        createMetric({
          date: 1700000000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        }),
        createMetric({
          date: 1700100000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        }),
      ]);

      const result = await repository.getMetricsByDateRange({
        metricTypes: [MetricTypesEnum.DELEGATED_SUPPLY],
        startDate: "1700000000",
        orderDirection: "asc",
        limit: 10,
      });

      expect(result).toHaveLength(2);
      expect(result[0]?.date).toBe(1700000000n);
      expect(result[1]?.date).toBe(1700100000n);
    });

    it("filters by endDate inclusive", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetric({
          date: 1699900000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        }),
        createMetric({
          date: 1700000000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        }),
        createMetric({
          date: 1700100000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        }),
      ]);

      const result = await repository.getMetricsByDateRange({
        metricTypes: [MetricTypesEnum.DELEGATED_SUPPLY],
        endDate: "1700000000",
        orderDirection: "asc",
        limit: 10,
      });

      expect(result).toHaveLength(2);
      expect(result[0]?.date).toBe(1699900000n);
      expect(result[1]?.date).toBe(1700000000n);
    });

    it("orders results by date ascending", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetric({
          date: 1700100000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        }),
        createMetric({
          date: 1699900000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        }),
        createMetric({
          date: 1700000000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        }),
      ]);

      const result = await repository.getMetricsByDateRange({
        metricTypes: [MetricTypesEnum.DELEGATED_SUPPLY],
        orderDirection: "asc",
        limit: 10,
      });

      expect(result.map((r) => r.date)).toEqual([
        1699900000n,
        1700000000n,
        1700100000n,
      ]);
    });

    it("orders results by date descending", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetric({
          date: 1699900000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        }),
        createMetric({
          date: 1700100000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        }),
        createMetric({
          date: 1700000000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        }),
      ]);

      const result = await repository.getMetricsByDateRange({
        metricTypes: [MetricTypesEnum.DELEGATED_SUPPLY],
        orderDirection: "desc",
        limit: 10,
      });

      expect(result.map((r) => r.date)).toEqual([
        1700100000n,
        1700000000n,
        1699900000n,
      ]);
    });

    it("respects the limit parameter", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetric({
          date: 1699900000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        }),
        createMetric({
          date: 1700000000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        }),
        createMetric({
          date: 1700100000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        }),
      ]);

      const result = await repository.getMetricsByDateRange({
        metricTypes: [MetricTypesEnum.DELEGATED_SUPPLY],
        orderDirection: "asc",
        limit: 2,
      });

      expect(result).toHaveLength(2);
    });

    it("only returns rows for the specified metric types and ignores others", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetric({
          date: 1700000000n,
          tokenId: "uni-delegated",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        }),
        createMetric({
          date: 1700000000n,
          tokenId: "uni-total",
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
        }),
        createMetric({
          date: 1700000000n,
          tokenId: "uni-treasury",
          metricType: MetricTypesEnum.TREASURY,
        }),
      ]);

      const result = await repository.getMetricsByDateRange({
        metricTypes: [
          MetricTypesEnum.DELEGATED_SUPPLY,
          MetricTypesEnum.TOTAL_SUPPLY,
        ],
        orderDirection: "asc",
        limit: 10,
      });

      expect(result).toHaveLength(2);
      const types = result.map((r) => r.metricType);
      expect(types).toContain(MetricTypesEnum.DELEGATED_SUPPLY);
      expect(types).toContain(MetricTypesEnum.TOTAL_SUPPLY);
      expect(types).not.toContain(MetricTypesEnum.TREASURY);
    });
  });

  describe("getLastMetricBeforeDate", () => {
    it("returns undefined when no data exists before the date", async () => {
      const result = await repository.getLastMetricBeforeDate(
        MetricTypesEnum.DELEGATED_SUPPLY,
        "1700000000",
      );

      expect(result).toBeUndefined();
    });

    it("returns the most recent metric strictly before the given date", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetric({
          date: 1699800000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          close: 100n,
        }),
        createMetric({
          date: 1699900000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          close: 200n,
        }),
      ]);

      const result = await repository.getLastMetricBeforeDate(
        MetricTypesEnum.DELEGATED_SUPPLY,
        "1700000000",
      );

      expect(result).toBeDefined();
      expect(result?.date).toBe(1699900000n);
      expect(result?.close).toBe(200n);
    });
  });
});
