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
import { TokenMetricsService } from "@/services/token-metrics";

import { tokenMetrics } from "./index";

type MetricInsert = typeof daoMetricsDayBucket.$inferInsert;

const createMetric = (overrides: Partial<MetricInsert> = {}): MetricInsert => ({
  date: 1700000000n,
  daoId: "UNI",
  tokenId: "uni",
  metricType: MetricTypesEnum.DELEGATED_SUPPLY,
  open: 0n,
  close: 0n,
  low: 0n,
  high: 1000000000000000000n,
  average: 0n,
  volume: 500000000000000000n,
  count: 1,
  lastUpdate: 1700000000n,
  ...overrides,
});

describe("TokenMetrics Controller", () => {
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
    const service = new TokenMetricsService(repo);
    app = new Hono();
    tokenMetrics(app, service);
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(daoMetricsDayBucket);
  });

  describe("GET /token-metrics", () => {
    it("should return 400 when metricType query param is missing", async () => {
      const res = await app.request("/token-metrics");

      expect(res.status).toBe(400);
    });

    it("should return 400 for an invalid metricType", async () => {
      const res = await app.request("/token-metrics?metricType=INVALID_METRIC");

      expect(res.status).toBe(400);
    });

    it("should return 200 with empty items when no data in DB for the metric", async () => {
      const res = await app.request(
        `/token-metrics?metricType=${MetricTypesEnum.DELEGATED_SUPPLY}`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startDate: null,
          endDate: null,
        },
      });
    });

    it("should return 200 with item when a DELEGATED_SUPPLY row exists", async () => {
      await db.insert(daoMetricsDayBucket).values(createMetric());

      // Scope to the exact seeded date to avoid forward-fill spanning to today
      const res = await app.request(
        `/token-metrics?metricType=${MetricTypesEnum.DELEGATED_SUPPLY}&startDate=1700000000&endDate=1700000000`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          {
            date: "1699920000",
            high: "1000000000000000000",
            volume: "500000000000000000",
          },
        ],
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startDate: "1699920000",
          endDate: "1699920000",
        },
      });
    });

    it("should accept optional orderDirection and limit ", async () => {
      const res = await app.request(
        `/token-metrics?metricType=${MetricTypesEnum.DELEGATED_SUPPLY}&orderDirection=desc&limit=30`,
      );

      expect(res.status).toBe(200);
    });
  });
});
