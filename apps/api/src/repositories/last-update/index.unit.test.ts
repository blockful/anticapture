import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { daoMetricsDayBucket } from "@/database/schema";
import { MetricTypesEnum } from "@/lib/constants";
import { ChartType } from "@/mappers/";
import { LastUpdateRepositoryImpl } from "./index";

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

describe("LastUpdateRepositoryImpl", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: LastUpdateRepositoryImpl;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new LastUpdateRepositoryImpl(db);

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

  describe("getLastUpdate", () => {
    it("returns undefined when no data exists for CostComparison", async () => {
      const result = await repository.getLastUpdate(ChartType.CostComparison);
      expect(result).toBeUndefined();
    });

    it("returns lastUpdate for CostComparison when DELEGATED_SUPPLY exists", async () => {
      await db.insert(daoMetricsDayBucket).values(
        createMetric({
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          lastUpdate: 1700000000n,
        }),
      );

      const result = await repository.getLastUpdate(ChartType.CostComparison);
      expect(result).toBe(1700000000n);
    });

    it("returns the maximum lastUpdate when multiple rows have different lastUpdate values", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetric({
          date: 1700000000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          lastUpdate: 1700000000n,
        }),
        createMetric({
          date: 1700086400n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          lastUpdate: 1700086400n,
        }),
      ]);

      const result = await repository.getLastUpdate(ChartType.CostComparison);
      expect(result).toBe(1700086400n);
    });

    it("returns undefined when only TOTAL_SUPPLY exists for CostComparison", async () => {
      await db.insert(daoMetricsDayBucket).values(
        createMetric({
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          lastUpdate: 1700000000n,
        }),
      );

      const result = await repository.getLastUpdate(ChartType.CostComparison);
      expect(result).toBeUndefined();
    });

    it("returns max lastUpdate from DELEGATED_SUPPLY and TREASURY rows for AttackProfitability", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetric({
          date: 1700000000n,
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          lastUpdate: 1700000000n,
        }),
        createMetric({
          date: 1700000000n,
          tokenId: "uni-treasury",
          metricType: MetricTypesEnum.TREASURY,
          lastUpdate: 1700999999n,
        }),
      ]);

      const result = await repository.getLastUpdate(
        ChartType.AttackProfitability,
      );
      expect(result).toBe(1700999999n);
    });
  });
});
