import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { daoMetricsDayBucket } from "@/database/schema";
import { MetricTypesEnum } from "@/lib/constants";
import { ChartType } from "@/mappers/";
import { lastUpdate } from "./index";

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

describe("lastUpdate Controller", () => {
  let client: PGlite;
  let db: Drizzle;
  let app: Hono;

  beforeAll(async () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();

    app = new Hono();
    lastUpdate(app, db);
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(daoMetricsDayBucket);
  });

  describe(`GET /last-update`, () => {
    const expectedTimestamp = 1700000000n;

    it("should return 200 with lastUpdate as ISO string when DELEGATED_SUPPLY data exists for cost_comparison", async () => {
      await db.insert(daoMetricsDayBucket).values(
        createMetric({
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          lastUpdate: expectedTimestamp,
        }),
      );

      const res = await app.request(
        `/last-update?chart=${ChartType.CostComparison}`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ lastUpdate: "2023-11-14T22:13:20.000Z" });
    });

    it("should return 200 with lastUpdate for attack_profitability when DELEGATED_SUPPLY data exists", async () => {
      await db.insert(daoMetricsDayBucket).values(
        createMetric({
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          lastUpdate: expectedTimestamp,
        }),
      );

      const res = await app.request(
        `/last-update?chart=${ChartType.AttackProfitability}`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ lastUpdate: "2023-11-14T22:13:20.000Z" });
    });

    it("should return 200 with lastUpdate for token_distribution when DELEGATED_SUPPLY data exists", async () => {
      await db.insert(daoMetricsDayBucket).values(
        createMetric({
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          lastUpdate: expectedTimestamp,
        }),
      );

      const res = await app.request(
        `/last-update?chart=${ChartType.TokenDistribution}`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ lastUpdate: "2023-11-14T22:13:20.000Z" });
    });

    it("should return 400 for an invalid chart param", async () => {
      const res = await app.request("/last-update?chart=invalid_chart");

      expect(res.status).toBe(400);
    });

    it("should return 400 when chart query param is missing", async () => {
      const res = await app.request("/last-update");

      expect(res.status).toBe(400);
    });

    it("should return the most recent lastUpdate when multiple records exist", async () => {
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

      const res = await app.request(
        `/last-update?chart=${ChartType.CostComparison}`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ lastUpdate: "2023-11-15T22:13:20.000Z" });
    });
  });
});
