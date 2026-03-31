import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { daoMetricsDayBucket } from "@/database/schema";
import { MetricTypesEnum } from "@/lib/constants";
import { DrizzleRepository } from "@/repositories/drizzle";
import { tokenDistribution } from "./token-distribution";
type MetricInsert = typeof daoMetricsDayBucket.$inferInsert;

const NOW = 1700000000;
const NINETY_DAYS = 90 * 24 * 60 * 60;

let client: PGlite;
let db: Drizzle;
let repo: DrizzleRepository;
let app: Hono;

const createMetric = (overrides: Partial<MetricInsert> = {}): MetricInsert => ({
  date: BigInt(NOW - 10),
  daoId: "ENS",
  tokenId: "ens",
  metricType: MetricTypesEnum.TOTAL_SUPPLY,
  open: 1000000000000000000n,
  close: 1200000000000000000n,
  low: 900000000000000000n,
  high: 1300000000000000000n,
  average: 1000000000000000000n,
  volume: 5000000000000000000n,
  count: 10,
  lastUpdate: BigInt(NOW),
  ...overrides,
});

beforeAll(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW * 1000);

  client = new PGlite();
  db = drizzle(client, { schema });
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { apply } = await pushSchema(schema, db as any);
  await apply();
});

afterAll(async () => {
  await client.close();
  vi.useRealTimers();
});

beforeEach(async () => {
  await db.delete(daoMetricsDayBucket);
  repo = new DrizzleRepository(db);
  app = new Hono();
  tokenDistribution(app, repo);
});

describe("Token Distribution Controller (integration)", () => {
  describe("GET /total-supply/compare", () => {
    it("should return zeros when no data exists", async () => {
      const res = await app.request("/total-supply/compare");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        previousValue: "0",
        currentValue: "0",
        changeRate: 0,
      });
    });

    it("should return 200 with comparison data", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetric({
          date: BigInt(NOW - 10),
          tokenId: "ens",
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          average: 1200000000000000000n,
        }),
        createMetric({
          date: BigInt(NOW - NINETY_DAYS - 10),
          tokenId: "ens-old",
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          average: 1000000000000000000n,
        }),
      ]);

      const res = await app.request("/total-supply/compare");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        currentValue: "1200000000000000000",
        previousValue: "1000000000000000000",
        changeRate: 0.2,
      });
    });

    it("should return changeRate=0 when oldValue is 0", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetric({
          date: BigInt(NOW - 10),
          tokenId: "ens",
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          average: 1000000000000000000n,
        }),
        createMetric({
          date: BigInt(NOW - NINETY_DAYS - 10),
          tokenId: "ens-old",
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          average: 0n,
        }),
      ]);

      const res = await app.request("/total-supply/compare");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        currentValue: "1000000000000000000",
        previousValue: "0",
        changeRate: 0,
      });
    });

    it("should accept days parameter", async () => {
      const res = await app.request("/total-supply/compare?days=30d");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        previousValue: "0",
        currentValue: "0",
        changeRate: 0,
      });
    });

    it("should compute correct changeRate for 20% increase", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetric({
          date: BigInt(NOW - 10),
          tokenId: "ens",
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          average: 1200000000000000000n,
        }),
        createMetric({
          date: BigInt(NOW - NINETY_DAYS - 10),
          tokenId: "ens-old",
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          average: 1000000000000000000n,
        }),
      ]);

      const res = await app.request("/total-supply/compare");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        currentValue: "1200000000000000000",
        previousValue: "1000000000000000000",
        changeRate: 0.2,
      });
    });
  });

  describe("GET /delegated-supply/compare", () => {
    it("should return 200 with correct key names", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetric({
          date: BigInt(NOW - 10),
          tokenId: "ens",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          average: 600n,
        }),
        createMetric({
          date: BigInt(NOW - NINETY_DAYS - 10),
          tokenId: "ens-old",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          average: 500n,
        }),
      ]);

      const res = await app.request("/delegated-supply/compare");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.changeRate).toBe(0.2);
      expect(String(body.previousValue)).toBe("500");
      expect(String(body.currentValue)).toBe("600");
    });
  });

  describe("GET /treasury/compare", () => {
    it("should return 200 with correct key names", async () => {
      await db.insert(daoMetricsDayBucket).values([
        createMetric({
          date: BigInt(NOW - 10),
          tokenId: "ens",
          metricType: MetricTypesEnum.TREASURY,
          average: 1100n,
        }),
        createMetric({
          date: BigInt(NOW - NINETY_DAYS - 10),
          tokenId: "ens-old",
          metricType: MetricTypesEnum.TREASURY,
          average: 1000n,
        }),
      ]);

      const res = await app.request("/treasury/compare");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.changeRate).toBe(0.1);
      expect(String(body.previousValue)).toBe("1000");
      expect(String(body.currentValue)).toBe("1100");
    });
  });

  describe("GET /lending-supply/compare", () => {
    it("should use default days=90d", async () => {
      const res = await app.request("/lending-supply/compare");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        previousValue: "0",
        currentValue: "0",
        changeRate: 0,
      });
    });
  });
});
