import { describe, it, expect } from "vitest";
import { MetricTypesEnum } from "@/lib/constants";
import { ITokenMetricsRepository, TokenMetricsService } from "./index";

type MetricRow = Awaited<
  ReturnType<ITokenMetricsRepository["getMetricsByDateRange"]>
>[number];

function createStubRepo(
  rows: MetricRow[] = [],
  lastMetric?: MetricRow,
): ITokenMetricsRepository {
  return {
    getMetricsByDateRange: async () => rows,
    getLastMetricBeforeDate: async () => lastMetric,
  };
}

const EMPTY_METRICS = {
  items: [],
  hasNextPage: false,
  startDate: null,
  endDate: null,
};

const createRow = (overrides: {
  date: bigint;
  high: bigint;
  volume: bigint;
}): MetricRow => ({
  date: overrides.date,
  high: overrides.high,
  volume: overrides.volume,
});

const ONE_DAY = 86400;
// Use midnight-aligned timestamps since the service normalizes to midnight UTC
const DAY1 = 1699920000; // midnight UTC

describe("TokenMetricsService", () => {
  describe("getMetricsForType", () => {
    it("should return empty result when no data and no initial value", async () => {
      const service = new TokenMetricsService(createStubRepo());

      const result = await service.getMetricsForType({
        metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        startDate: DAY1,
        orderDirection: "asc",
        limit: 365,
      });

      expect(result).toEqual(EMPTY_METRICS);
    });

    it("should return items from repository data", async () => {
      const repo = createStubRepo([
        createRow({ date: BigInt(DAY1), high: 1000n, volume: 100n }),
      ]);
      const service = new TokenMetricsService(repo);

      const result = await service.getMetricsForType({
        metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        startDate: DAY1,
        endDate: DAY1,
        orderDirection: "asc",
        limit: 365,
      });

      expect(result).toEqual({
        items: [{ date: DAY1.toString(), high: "1000", volume: "100" }],
        hasNextPage: false,
        startDate: DAY1.toString(),
        endDate: DAY1.toString(),
      });
    });

    it("should forward-fill gaps using initial value when startDate is provided", async () => {
      const day4 = DAY1 + 3 * ONE_DAY;

      const repo = createStubRepo(
        [createRow({ date: BigInt(day4), high: 800n, volume: 80n })],
        createRow({
          date: BigInt(DAY1 - ONE_DAY),
          high: 500n,
          volume: 50n,
        }),
      );
      const service = new TokenMetricsService(repo);

      const result = await service.getMetricsForType({
        metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        startDate: DAY1,
        endDate: day4,
        orderDirection: "asc",
        limit: 365,
      });

      expect(result).toEqual({
        items: [
          { date: DAY1.toString(), high: "500", volume: "0" },
          { date: (DAY1 + ONE_DAY).toString(), high: "500", volume: "0" },
          {
            date: (DAY1 + 2 * ONE_DAY).toString(),
            high: "500",
            volume: "0",
          },
          { date: day4.toString(), high: "800", volume: "80" },
        ],
        hasNextPage: false,
        startDate: DAY1.toString(),
        endDate: day4.toString(),
      });
    });

    it("should not fetch initial value when no startDate provided", async () => {
      const repo = createStubRepo();
      repo.getLastMetricBeforeDate = async () => {
        throw new Error("DB error");
      };
      const service = new TokenMetricsService(repo);

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
            date: BigInt(DAY1 + i * ONE_DAY),
            high: BigInt(i * 100),
            volume: 0n,
          }),
        ),
      );
      const service = new TokenMetricsService(repo);

      const result = await service.getMetricsForType({
        metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        startDate: DAY1,
        endDate: DAY1 + 9 * ONE_DAY,
        orderDirection: "asc",
        limit: 5,
      });

      expect(result).toEqual({
        items: [
          { date: DAY1.toString(), high: "0", volume: "0" },
          { date: (DAY1 + ONE_DAY).toString(), high: "100", volume: "0" },
          {
            date: (DAY1 + 2 * ONE_DAY).toString(),
            high: "200",
            volume: "0",
          },
          {
            date: (DAY1 + 3 * ONE_DAY).toString(),
            high: "300",
            volume: "0",
          },
          {
            date: (DAY1 + 4 * ONE_DAY).toString(),
            high: "400",
            volume: "0",
          },
        ],
        hasNextPage: true,
        startDate: DAY1.toString(),
        endDate: (DAY1 + 4 * ONE_DAY).toString(),
      });
    });

    it("should return items in descending order when specified", async () => {
      const day2 = DAY1 + ONE_DAY;
      const repo = createStubRepo([
        createRow({ date: BigInt(day2), high: 200n, volume: 20n }),
        createRow({ date: BigInt(DAY1), high: 100n, volume: 10n }),
      ]);
      const service = new TokenMetricsService(repo);

      const result = await service.getMetricsForType({
        metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        startDate: DAY1,
        endDate: day2,
        orderDirection: "desc",
        limit: 365,
      });

      expect(result).toEqual({
        items: [
          { date: day2.toString(), high: "200", volume: "20" },
          { date: DAY1.toString(), high: "100", volume: "10" },
        ],
        hasNextPage: false,
        startDate: day2.toString(),
        endDate: DAY1.toString(),
      });
    });

    it("should handle error fetching initial value gracefully", async () => {
      const repo = createStubRepo([
        createRow({ date: BigInt(DAY1), high: 1000n, volume: 100n }),
      ]);
      repo.getLastMetricBeforeDate = async () => {
        throw new Error("DB error");
      };
      const service = new TokenMetricsService(repo);

      const result = await service.getMetricsForType({
        metricType: MetricTypesEnum.DELEGATED_SUPPLY,
        startDate: DAY1,
        endDate: DAY1,
        orderDirection: "asc",
        limit: 365,
      });

      expect(result).toEqual({
        items: [{ date: DAY1.toString(), high: "1000", volume: "100" }],
        hasNextPage: false,
        startDate: DAY1.toString(),
        endDate: DAY1.toString(),
      });
    });
  });
});
