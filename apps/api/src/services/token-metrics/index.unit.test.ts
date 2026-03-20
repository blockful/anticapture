import { describe, it, expect } from "vitest";
import { MetricTypesEnum } from "@/lib/constants";
import { TokenMetricsService } from "./index";

type MetricRow = {
  date: bigint;
  daoId: string;
  tokenId: string;
  metricType: string;
  open: bigint;
  close: bigint;
  low: bigint;
  high: bigint;
  average: bigint;
  volume: bigint;
  count: number;
  lastUpdate: bigint;
};

function createStubRepo(rows: MetricRow[] = [], lastMetric?: MetricRow) {
  return {
    getMetricsByDateRange: async () => rows,
    getLastMetricBeforeDate: async () => lastMetric,
  };
}

const createRow = (overrides: Partial<MetricRow> = {}): MetricRow => ({
  date: 1700000000n,
  daoId: "UNI",
  tokenId: "uni",
  metricType: MetricTypesEnum.DELEGATED_SUPPLY,
  open: 0n,
  close: 0n,
  low: 0n,
  high: 1000n,
  average: 0n,
  volume: 100n,
  count: 1,
  lastUpdate: 1700000000n,
  ...overrides,
});

const ONE_DAY = 86400;

describe("TokenMetricsService", () => {
  describe("getMetricsForType", () => {
    it("should return empty result when no data and no initial value", async () => {
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const service = new TokenMetricsService(createStubRepo() as any);

      const result = await service.getMetricsForType({
        metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        startDate: 1700000000,
        orderDirection: "asc",
        limit: 365,
      });

      expect(result.items).toHaveLength(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.startDate).toBeNull();
      expect(result.endDate).toBeNull();
    });

    it("should return items from repository data", async () => {
      const day1 = 1700000000n;
      const repo = createStubRepo([
        createRow({ date: day1, high: 1000n, volume: 100n }),
      ]);
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const service = new TokenMetricsService(repo as any);

      const result = await service.getMetricsForType({
        metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        startDate: Number(day1),
        endDate: Number(day1),
        orderDirection: "asc",
        limit: 365,
      });

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.startDate).not.toBeNull();
      expect(result.endDate).not.toBeNull();
    });

    it("should forward-fill gaps using initial value when startDate is provided", async () => {
      const existingDate = 1700259200n; // 3 days later

      const repo = createStubRepo(
        [createRow({ date: existingDate, high: 800n, volume: 80n })],
        createRow({ date: 1699913600n, high: 500n, volume: 50n }),
      );
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const service = new TokenMetricsService(repo as any);

      const result = await service.getMetricsForType({
        metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        startDate: 1700000000,
        endDate: Number(existingDate),
        orderDirection: "asc",
        limit: 365,
      });

      expect(result.items.length).toBeGreaterThan(1);
    });

    it("should not fetch initial value when no startDate provided", async () => {
      const repo = createStubRepo();
      repo.getLastMetricBeforeDate = async () => {
        throw new Error("DB error");
      };
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const service = new TokenMetricsService(repo as any);

      await expect(
        service.getMetricsForType({
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          orderDirection: "asc",
          limit: 365,
        }),
      ).resolves.not.toThrow();
    });

    it("should apply pagination with limit", async () => {
      const repo = createStubRepo(
        Array.from({ length: 6 }, (_, i) =>
          createRow({
            date: BigInt(1700000000 + i * ONE_DAY),
            high: BigInt(i * 100),
            volume: 0n,
          }),
        ),
      );
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const service = new TokenMetricsService(repo as any);

      const result = await service.getMetricsForType({
        metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        startDate: 1700000000,
        endDate: 1700000000 + 9 * ONE_DAY,
        orderDirection: "asc",
        limit: 5,
      });

      expect(result.items).toHaveLength(5);
      expect(result.hasNextPage).toBe(true);
    });

    it("should return items in descending order when specified", async () => {
      const repo = createStubRepo([
        createRow({
          date: BigInt(1700000000 + ONE_DAY),
          high: 200n,
          volume: 20n,
        }),
        createRow({ date: 1700000000n, high: 100n, volume: 10n }),
      ]);
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const service = new TokenMetricsService(repo as any);

      const result = await service.getMetricsForType({
        metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        startDate: 1700000000,
        endDate: 1700000000 + ONE_DAY,
        orderDirection: "desc",
        limit: 365,
      });

      expect(result.items.length).toBeGreaterThan(0);
      if (result.items.length >= 2) {
        expect(Number(result.items[0]!.date)).toBeGreaterThan(
          Number(result.items[1]!.date),
        );
      }
    });

    it("should handle error fetching initial value gracefully", async () => {
      const repo = createStubRepo([
        createRow({ date: 1700000000n, high: 1000n, volume: 100n }),
      ]);
      repo.getLastMetricBeforeDate = async () => {
        throw new Error("DB error");
      };
      /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
      const service = new TokenMetricsService(repo as any);

      const result = await service.getMetricsForType({
        metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        startDate: 1700000000,
        orderDirection: "asc",
        limit: 365,
      });

      expect(result.items.length).toBeGreaterThan(0);
    });
  });
});
