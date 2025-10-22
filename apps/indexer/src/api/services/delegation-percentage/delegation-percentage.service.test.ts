import { DelegationPercentageService } from "./delegation-percentage.service";
import { DelegationPercentageRepository } from "@/api/repositories/delegation-percentage.repository";
import type { DaoMetricRow } from "@/api/mappers/delegation-percentage";
import { MetricTypesEnum } from "@/lib/constants";

/**
 * Mock Factory Pattern for type-safe test data
 * Creates complete DaoMetricRow objects with sensible defaults
 * Only requires specifying fields relevant to each test case
 */
const createMockRow = (
  overwrites: Partial<DaoMetricRow> = {},
): DaoMetricRow => ({
  date: 0n,
  daoId: "uniswap",
  tokenId: "uni",
  metricType: MetricTypesEnum.DELEGATED_SUPPLY,
  open: 0n,
  close: 0n,
  low: 0n,
  high: 0n,
  average: 0n,
  volume: 0n,
  count: 0,
  lastUpdate: 0n,
  ...overwrites,
});

describe("DelegationPercentageService", () => {
  let service: DelegationPercentageService;
  let mockRepository: jest.Mocked<DelegationPercentageRepository>;

  beforeEach(() => {
    mockRepository = {
      getDaoMetricsByDateRange: jest.fn(),
      getLastMetricValueBefore: jest.fn(),
    } as jest.Mocked<DelegationPercentageRepository>;

    service = new DelegationPercentageService(mockRepository);
  });

  describe("getDelegationPercentage", () => {
    it("should return empty response when no data is available", async () => {
      mockRepository.getDaoMetricsByDateRange.mockResolvedValue([]);

      const result = await service.getDelegationPercentage({
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.hasNextPage).toBe(false);
      expect(result.startDate).toBeNull();
      expect(result.endDate).toBeNull();
    });

    it("should calculate delegation percentage correctly", async () => {
      const mockRows = [
        createMockRow({
          date: 1600041600n,
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 50000000000000000000n, // 50 tokens delegated
        }),
        createMockRow({
          date: 1600041600n,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n, // 100 tokens total
        }),
      ];

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: "1600041600",
        endDate: "1600041600",
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(result.items).toHaveLength(1);
      // 50/100 = 0.5 = 50%
      expect(result.items[0]?.high).toBe("50.00");
      expect(result.items[0]?.date).toBe("1600041600");
    });

    it("should apply forward-fill for missing dates", async () => {
      const ONE_DAY = 86400;
      const day1 = 1600041600n;
      const day2 = day1 + BigInt(ONE_DAY);
      const day3 = day2 + BigInt(ONE_DAY);

      const mockRows = [
        // Day 1: 40% delegation
        createMockRow({
          date: day1,
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 40000000000000000000n,
        }),
        createMockRow({
          date: day1,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        }),
        // Day 3: 60% delegation (day 2 is missing)
        createMockRow({
          date: day3,
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 60000000000000000000n,
        }),
        createMockRow({
          date: day3,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        }),
      ];

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: day1.toString(),
        endDate: day3.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(result.items).toHaveLength(3);
      // Day 1: 40%
      expect(result.items[0]?.high).toBe("40.00");
      // Day 2: forward-filled from day 1 = 40%
      expect(result.items[1]?.high).toBe("40.00");
      expect(result.items[1]?.date).toBe(day2.toString());
      // Day 3: 60%
      expect(result.items[2]?.high).toBe("60.00");
    });

    it("should handle division by zero when total supply is zero", async () => {
      const mockRows = [
        createMockRow({
          date: 1600041600n,
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 50000000000000000000n,
        }),
        createMockRow({
          date: 1600041600n,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 0n, // zero total supply
        }),
      ];

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: "1600041600",
        endDate: "1600041600",
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.high).toBe("0.00"); // Should be 0 instead of throwing error
    });

    it("should apply pagination with limit", async () => {
      const ONE_DAY = 86400;
      const mockRows = [];

      // Create 5 days of data
      for (let i = 0; i < 5; i++) {
        const date = BigInt(1600041600 + i * ONE_DAY);
        mockRows.push(
          createMockRow({
            date,
            metricType: MetricTypesEnum.DELEGATED_SUPPLY,
            high: 50000000000000000000n,
          }),
          createMockRow({
            date,
            metricType: MetricTypesEnum.TOTAL_SUPPLY,
            high: 100000000000000000000n,
          }),
        );
      }

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: "1600041600",
        endDate: "1600387200", // 5 days
        limit: 3,
        orderDirection: "asc" as const,
      });

      expect(result.items).toHaveLength(3);
      expect(result.hasNextPage).toBe(true);
      expect(result.startDate).toBe("1600041600");
      expect(result.endDate).toBe("1600214400");
    });

    it("should apply cursor-based pagination with after", async () => {
      const ONE_DAY = 86400;
      const mockRows = [];

      // Create 5 days of data
      for (let i = 0; i < 5; i++) {
        const date = BigInt(1600041600 + i * ONE_DAY);
        mockRows.push(
          createMockRow({
            date,
            metricType: MetricTypesEnum.DELEGATED_SUPPLY,
            high: 50000000000000000000n,
          }),
          createMockRow({
            date,
            metricType: MetricTypesEnum.TOTAL_SUPPLY,
            high: 100000000000000000000n,
          }),
        );
      }

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: "1600041600",
        endDate: "1600387200",
        after: "1600128000", // After day 2
        limit: 2,
        orderDirection: "asc" as const,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.date).toBe("1600214400"); // Day 3
      expect(result.items[1]?.date).toBe("1600300800"); // Day 4
    });

    it("should apply cursor-based pagination with before", async () => {
      const ONE_DAY = 86400;
      const mockRows = [];

      // Create 5 days of data
      for (let i = 0; i < 5; i++) {
        const date = BigInt(1600041600 + i * ONE_DAY);
        mockRows.push(
          createMockRow({
            date,
            metricType: MetricTypesEnum.DELEGATED_SUPPLY,
            high: 50000000000000000000n,
          }),
          createMockRow({
            date,
            metricType: MetricTypesEnum.TOTAL_SUPPLY,
            high: 100000000000000000000n,
          }),
        );
      }

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: "1600041600",
        endDate: "1600387200",
        before: "1600214400", // Before day 3
        limit: 2,
        orderDirection: "asc" as const,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.date).toBe("1600041600"); // Day 1
      expect(result.items[1]?.date).toBe("1600128000"); // Day 2
    });

    it("should sort data in descending order when specified", async () => {
      const ONE_DAY = 86400;
      const mockRows = [];

      // Create 3 days of data
      for (let i = 0; i < 3; i++) {
        const date = BigInt(1600041600 + i * ONE_DAY);
        mockRows.push(
          createMockRow({
            date,
            metricType: MetricTypesEnum.DELEGATED_SUPPLY,
            high: BigInt(30 + i * 10) * BigInt(1e18),
          }),
          createMockRow({
            date,
            metricType: MetricTypesEnum.TOTAL_SUPPLY,
            high: 100000000000000000000n,
          }),
        );
      }

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: "1600041600",
        endDate: "1600214400",
        orderDirection: "desc",
        limit: 365,
      });

      expect(result.items).toHaveLength(3);
      // Should be in descending order
      expect(result.items[0]?.date).toBe("1600214400"); // Day 3
      expect(result.items[1]?.date).toBe("1600128000"); // Day 2
      expect(result.items[2]?.date).toBe("1600041600"); // Day 1
    });

    it("should use default values when optional parameters are not provided", async () => {
      mockRepository.getDaoMetricsByDateRange.mockResolvedValue([]);

      const result = await service.getDelegationPercentage({
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(mockRepository.getDaoMetricsByDateRange).toHaveBeenCalledWith({
        startDate: undefined,
        endDate: undefined,
        orderDirection: "asc",
        limit: 366,
      });
      expect(result.items).toHaveLength(0);
    });

    it("should handle complex scenario with multiple days and changing values", async () => {
      const ONE_DAY = 86400;
      const day1 = 1600041600n;
      const day2 = day1 + BigInt(ONE_DAY);
      const day3 = day2 + BigInt(ONE_DAY);
      const day4 = day3 + BigInt(ONE_DAY);

      const mockRows = [
        // Day 1: 25% (25/100)
        createMockRow({
          date: day1,
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 25000000000000000000n,
        }),
        createMockRow({
          date: day1,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        }),
        // Day 2: only total supply changes to 200 -> 25/200 = 12.5%
        createMockRow({
          date: day2,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 200000000000000000000n,
        }),
        // Day 3: delegated changes to 50 -> 50/200 = 25%
        createMockRow({
          date: day3,
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 50000000000000000000n,
        }),
        // Day 4: no changes -> forward fill 50/200 = 25%
      ];

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: day1.toString(),
        endDate: day4.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(result.items).toHaveLength(4);
      // Day 1: 25%
      expect(result.items[0]?.high).toBe("25.00");
      // Day 2: 12.5% (25/200)
      expect(result.items[1]?.high).toBe("12.50");
      // Day 3: 25% (50/200)
      expect(result.items[2]?.high).toBe("25.00");
      // Day 4: 25% (forward-filled)
      expect(result.items[3]?.high).toBe("25.00");
    });

    it("should use last known values before startDate for forward-fill", async () => {
      const ONE_DAY = 86400;
      const day1 = 1599955200n;
      const day100 = day1 + BigInt(ONE_DAY * 100);
      const day105 = day100 + BigInt(ONE_DAY * 5);

      mockRepository.getLastMetricValueBefore
        .mockResolvedValueOnce(
          createMockRow({
            date: day1,
            metricType: MetricTypesEnum.DELEGATED_SUPPLY,
            high: 40000000000000000000n,
          }),
        )
        .mockResolvedValueOnce(
          createMockRow({
            date: day1,
            metricType: MetricTypesEnum.TOTAL_SUPPLY,
            high: 100000000000000000000n,
          }),
        );

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue([
        createMockRow({
          date: day105,
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 60000000000000000000n,
        }),
        createMockRow({
          date: day105,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        }),
      ]);

      const result = await service.getDelegationPercentage({
        startDate: day100.toString(),
        endDate: day105.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(result.items).toHaveLength(6);
      // Days 100-104: should use values from day 1 (40/100 = 40%)
      expect(result.items[0]?.high).toBe("40.00"); // day 100
      expect(result.items[4]?.high).toBe("40.00"); // day 104
      // Day 105: new value (60/100 = 60%)
      expect(result.items[5]?.high).toBe("60.00");
    });

    it("should handle when only one metric has previous value", async () => {
      const ONE_DAY = 86400;
      const day50 = 1599955200n;
      const day100 = day50 + BigInt(ONE_DAY * 50);

      // Mock: only DELEGATED has previous value
      mockRepository.getLastMetricValueBefore
        .mockResolvedValueOnce(
          createMockRow({
            date: day50,
            metricType: MetricTypesEnum.DELEGATED_SUPPLY,
            high: 30000000000000000000n,
          }),
        )
        .mockResolvedValueOnce(null); // TOTAL_SUPPLY has no previous value

      // Main data: TOTAL_SUPPLY appears on day 100
      mockRepository.getDaoMetricsByDateRange.mockResolvedValue([
        createMockRow({
          date: day100,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        }),
      ]);

      const result = await service.getDelegationPercentage({
        startDate: day100.toString(),
        endDate: day100.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      // With total = 100 and delegated = 30 (from past) = 30%
      expect(result.items[0]?.high).toBe("30.00");
    });

    it("should start with 0% when no previous values exist", async () => {
      const day100 = 1599955200n;

      // Mock: no previous values
      mockRepository.getLastMetricValueBefore
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      // Main data: appears only on day 100
      mockRepository.getDaoMetricsByDateRange.mockResolvedValue([
        createMockRow({
          date: day100,
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 50000000000000000000n,
        }),
        createMockRow({
          date: day100,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        }),
      ]);

      const result = await service.getDelegationPercentage({
        startDate: day100.toString(),
        endDate: day100.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      // Should use values from day 100 directly (50/100 = 50%)
      expect(result.items[0]?.high).toBe("50.00");
    });

    it("should not fetch previous values when neither startDate nor after is provided", async () => {
      mockRepository.getDaoMetricsByDateRange.mockResolvedValue([]);

      await service.getDelegationPercentage({
        limit: 365,
        orderDirection: "asc" as const,
      });

      // Should not call getLastMetricValueBefore when no reference date
      expect(mockRepository.getLastMetricValueBefore).not.toHaveBeenCalled();
    });

    it("should fallback to 0 when fetching previous values fails", async () => {
      const day100 = 1599955200n;

      // Mock console.error to suppress test output
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock: error fetching previous values
      mockRepository.getLastMetricValueBefore.mockRejectedValue(
        new Error("Database error"),
      );

      // Main data
      mockRepository.getDaoMetricsByDateRange.mockResolvedValue([
        createMockRow({
          date: day100,
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 50000000000000000000n,
        }),
        createMockRow({
          date: day100,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        }),
      ]);

      const result = await service.getDelegationPercentage({
        startDate: day100.toString(),
        endDate: day100.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      // Should work normally with fallback to 0 (50/100 = 50%)
      expect(result.items[0]?.high).toBe("50.00");
      expect(result.items).toHaveLength(1);

      // Verify error was logged
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error fetching initial values:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });

    it("should adjust startDate when requested startDate is before first real data", async () => {
      const ONE_DAY = 86400;
      const day5 = 1599955200n;
      const day10 = day5 + BigInt(ONE_DAY * 5);
      const day15 = day10 + BigInt(ONE_DAY * 5);

      // Mock: no values before day 5
      mockRepository.getLastMetricValueBefore
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      // Real data starts on day 10
      mockRepository.getDaoMetricsByDateRange.mockResolvedValue([
        createMockRow({
          date: day10,
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 40000000000000000000n,
        }),
        createMockRow({
          date: day10,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        }),
        createMockRow({
          date: day15,
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 50000000000000000000n,
        }),
        createMockRow({
          date: day15,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        }),
      ]);

      const result = await service.getDelegationPercentage({
        startDate: day5.toString(),
        endDate: day15.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      // Should start from day 10 (first real data), not day 5
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0]?.date).toBe(day10.toString());
      expect(result.items[0]?.high).toBe("40.00");

      // Should not have data from day 5-9 (before first real data)
      const hasDayBefore10 = result.items.some(
        (item) => BigInt(item.date) < day10,
      );
      expect(hasDayBefore10).toBe(false);
    });

    it("should return empty when startDate is after all available data", async () => {
      const day5 = 1599955200n;
      const day100 = day5 + BigInt(86400 * 100);

      // Mock: no values before day 100
      mockRepository.getLastMetricValueBefore
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      // Mock: no data >= day 100
      mockRepository.getDaoMetricsByDateRange.mockResolvedValue([]);

      const result = await service.getDelegationPercentage({
        startDate: day100.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      // Should return empty
      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.hasNextPage).toBe(false);
    });

    it("should fetch previous values and optimize query when only after is provided", async () => {
      const ONE_DAY = 86400;
      const day1 = 1599955200n;
      const day50 = day1 + BigInt(ONE_DAY * 50);
      const day100 = day50 + BigInt(ONE_DAY * 50);

      // Mock: values before day50
      mockRepository.getLastMetricValueBefore
        .mockResolvedValueOnce(
          createMockRow({
            date: day1,
            metricType: MetricTypesEnum.DELEGATED_SUPPLY,
            high: 30000000000000000000n, // 30%
          }),
        )
        .mockResolvedValueOnce(
          createMockRow({
            date: day1,
            metricType: MetricTypesEnum.TOTAL_SUPPLY,
            high: 100000000000000000000n,
          }),
        );

      // Mock: data from day50 onwards (query should be optimized)
      mockRepository.getDaoMetricsByDateRange.mockResolvedValue([
        createMockRow({
          date: day100,
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 50000000000000000000n,
        }),
        createMockRow({
          date: day100,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        }),
      ]);

      const result = await service.getDelegationPercentage({
        after: day50.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      // Verify query was optimized (used after as startDate)
      expect(mockRepository.getDaoMetricsByDateRange).toHaveBeenCalledWith({
        startDate: day50.toString(),
        endDate: undefined,
        orderDirection: "asc",
        limit: 366, // 365 + 1 for hasNextPage detection
      });

      // Verify previous values were fetched
      expect(mockRepository.getLastMetricValueBefore).toHaveBeenCalledTimes(2);

      // Results should have correct forward-fill from previous values
      expect(result.items.length).toBeGreaterThan(0);
    });

    it("should optimize query when only before is provided", async () => {
      const day1 = 1599955200n;
      const day50 = day1 + BigInt(86400 * 50);

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue([
        createMockRow({
          date: day1,
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 30000000000000000000n,
        }),
        createMockRow({
          date: day1,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        }),
      ]);

      const result = await service.getDelegationPercentage({
        before: day50.toString(),
        endDate: day50.toString(), // Add explicit endDate to prevent forward-fill to today
        limit: 365,
        orderDirection: "asc" as const,
      });

      // Verify query was optimized (used before as endDate)
      expect(mockRepository.getDaoMetricsByDateRange).toHaveBeenCalledWith({
        startDate: undefined,
        endDate: day50.toString(),
        orderDirection: "asc",
        limit: 366, // 365 + 1 for hasNextPage detection
      });

      // Should not fetch previous values (no startDate or after)
      expect(mockRepository.getLastMetricValueBefore).not.toHaveBeenCalled();

      // With forward-fill, should generate from day1 to day50 (50 days)
      expect(result.items.length).toBeGreaterThan(1);
      // First day should have 30%
      expect(result.items[0]?.high).toBe("30.00");
      // All days should have forward-filled value of 30%
      result.items.forEach((item) => {
        expect(item.high).toBe("30.00");
      });
    });

    it("should forward-fill to today when endDate is not provided", async () => {
      const ONE_DAY = 86400;
      const threeDaysAgo = Date.now() / 1000 - 3 * ONE_DAY;
      const threeDaysAgoMidnight = Math.floor(threeDaysAgo / ONE_DAY) * ONE_DAY;

      // Mock data from 3 days ago (only last data point)
      const mockRows = [
        createMockRow({
          date: BigInt(threeDaysAgoMidnight),
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 50000000000000000000n,
        }),
        createMockRow({
          date: BigInt(threeDaysAgoMidnight),
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        }),
      ];

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: threeDaysAgoMidnight.toString(),
        // No endDate - should forward-fill to today
        limit: 10,
        orderDirection: "asc" as const,
      });

      // Should have data from 3 days ago until today (4 days total)
      expect(result.items.length).toBeGreaterThanOrEqual(4);

      // All items should have the same percentage (forward-filled)
      // 50/100 = 0.5 = 50%
      result.items.forEach((item) => {
        expect(item.high).toBe("50.00");
      });

      // Last item should be today
      const todayMidnight = Math.floor(Date.now() / 1000 / ONE_DAY) * ONE_DAY;
      expect(result.items[result.items.length - 1]?.date).toBe(
        todayMidnight.toString(),
      );
    });

    it("should set hasNextPage to false when reaching today without endDate", async () => {
      const ONE_DAY = 86400;
      const twoDaysAgo = Date.now() / 1000 - 2 * ONE_DAY;
      const twoDaysAgoMidnight = Math.floor(twoDaysAgo / ONE_DAY) * ONE_DAY;

      const mockRows = [
        createMockRow({
          date: BigInt(twoDaysAgoMidnight),
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 50000000000000000000n,
        }),
        createMockRow({
          date: BigInt(twoDaysAgoMidnight),
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        }),
      ];

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: twoDaysAgoMidnight.toString(),
        // No endDate, limit covers all days to today
        limit: 10,
        orderDirection: "asc" as const,
      });

      // Should have hasNextPage = false because we reached today
      expect(result.hasNextPage).toBe(false);
    });

    it("should set hasNextPage to true when limit cuts before today without endDate", async () => {
      const ONE_DAY = 86400;
      const tenDaysAgo = Date.now() / 1000 - 10 * ONE_DAY;
      const tenDaysAgoMidnight = Math.floor(tenDaysAgo / ONE_DAY) * ONE_DAY;

      const mockRows = [
        createMockRow({
          date: BigInt(tenDaysAgoMidnight),
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 50000000000000000000n,
        }),
        createMockRow({
          date: BigInt(tenDaysAgoMidnight),
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        }),
      ];

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: tenDaysAgoMidnight.toString(),
        // No endDate, but limit only returns 3 items (not reaching today)
        limit: 3,
        orderDirection: "asc" as const,
      });

      // Should have exactly 3 items
      expect(result.items).toHaveLength(3);

      // Should have hasNextPage = true because we didn't reach today
      expect(result.hasNextPage).toBe(true);
    });
  });
});
