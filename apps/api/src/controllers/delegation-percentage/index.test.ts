import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import * as schema from "@/database/schema";
import { daoMetricsDayBucket } from "@/database/schema";
import { MetricTypesEnum } from "@/lib/constants";
import { DaoMetricsDayBucketRepository } from "@/repositories/daoMetricsDayBucket";
import { DelegationPercentageService } from "@/services";
import { delegationPercentage } from "./index";
type MetricInsert = typeof daoMetricsDayBucket.$inferInsert;

const TEST_DATE = 1699920000n;

const createMetric = (overrides: Partial<MetricInsert> = {}): MetricInsert => ({
  date: TEST_DATE,
  daoId: "UNI",
  tokenId: "uni",
  metricType: MetricTypesEnum.DELEGATED_SUPPLY,
  open: 0n,
  close: 0n,
  low: 0n,
  high: 500n,
  average: 0n,
  volume: 0n,
  count: 1,
  lastUpdate: 1700000000n,
  ...overrides,
});

describe("DelegationPercentage Controller", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
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

    const repo = new DaoMetricsDayBucketRepository(db);
    const service = new DelegationPercentageService(repo);
    app = new Hono();
    delegationPercentage(app, service);
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(daoMetricsDayBucket);
  });

  describe("GET /delegation-percentage", () => {
    it("should return 200 with empty response when no data", async () => {
      const res = await app.request("/delegation-percentage");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [],
        totalCount: 0,
        pageInfo: {
          hasNextPage: false,
          startDate: null,
          endDate: null,
        },
      });
    });

    it("should return 200 with correct percentage", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetric({
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 500n,
        }),
        createMetric({
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 1000n,
        }),
      ]);

      // Scope to the exact seeded date (midnight-aligned) to get exactly 1 item
      const res = await app.request(
        `/delegation-percentage?startDate=${TEST_DATE}&endDate=${TEST_DATE}`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(1);
      expect(body.items[0].high).toBe("50.00");
    });

    it("should have pageInfo shape in response", async () => {
      const res = await app.request("/delegation-percentage");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toHaveProperty("pageInfo");
      expect(body.pageInfo).toHaveProperty("hasNextPage");
      expect(body.pageInfo).toHaveProperty("startDate");
      expect(body.pageInfo).toHaveProperty("endDate");
    });

    it("should accept orderDirection and limit", async () => {
      const res = await app.request(
        "/delegation-percentage?orderDirection=desc&limit=30",
      );

      expect(res.status).toBe(200);
    });
  });
});
