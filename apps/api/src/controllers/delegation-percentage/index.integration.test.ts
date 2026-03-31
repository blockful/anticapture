import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Drizzle } from "@/database";
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
  let db: Drizzle;
  let app: Hono;

  beforeAll(async () => {
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
          hasPreviousPage: false,
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
      expect(body).toEqual({
        items: [{ date: "1699920000", high: "50.00" }],
        totalCount: 1,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startDate: "1699920000",
          endDate: "1699920000",
        },
      });
    });

    it("should have pageInfo shape in response", async () => {
      const res = await app.request("/delegation-percentage");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [],
        totalCount: 0,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startDate: null,
          endDate: null,
        },
      });
    });

    it("should accept orderDirection and limit", async () => {
      const DATE_2 = TEST_DATE + 86400n;

      await db.insert(daoMetricsDayBucket).values([
        createMetric({
          date: TEST_DATE,
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 500n,
        }),
        createMetric({
          date: TEST_DATE,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 1000n,
        }),
        createMetric({
          date: DATE_2,
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 300n,
        }),
        createMetric({
          date: DATE_2,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 1000n,
        }),
      ]);

      const res = await app.request(
        `/delegation-percentage?orderDirection=desc&limit=1&endDate=${DATE_2}`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // DATE_2 is newer so desc order returns it first; limit=1 from 2 total dates
      expect(body).toEqual({
        items: [{ date: String(DATE_2), high: "30.00" }],
        totalCount: 1,
        pageInfo: {
          hasNextPage: true,
          hasPreviousPage: false,
          startDate: String(DATE_2),
          endDate: String(DATE_2),
        },
      });
    });
  });
});
