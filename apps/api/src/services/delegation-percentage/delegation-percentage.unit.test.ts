import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { MetricTypesEnum } from "@/lib/constants";
import { DBTokenMetric } from "@/mappers/delegation-percentage";

import {
  DelegationPercentageRepository,
  DelegationPercentageService,
  DelegationPercentageServiceResult,
} from "./delegation-percentage";

/**
 * Mock Factory Pattern for type-safe test data
 * Creates complete DaoMetricRow objects with sensible defaults
 * Only requires specifying fields relevant to each test case
 */
const createMockRow = (
  overrides: Partial<DBTokenMetric> = {},
): DBTokenMetric => ({
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
  ...overrides,
});

const FIXED_DATE = new Date("2026-01-15T00:00:00Z");
const FIXED_TIMESTAMP = Math.floor(FIXED_DATE.getTime() / 1000);

describe("DelegationPercentageService", () => {
  let service: DelegationPercentageService;
  let mockRepository: DelegationPercentageRepository & {
    getMetricsByDateRange: ReturnType<typeof vi.fn>;
    getLastMetricBeforeDate: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(FIXED_DATE);

    mockRepository = {
      getMetricsByDateRange: vi.fn(),
      getLastMetricBeforeDate: vi.fn(),
    };

    service = new DelegationPercentageService(mockRepository);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("delegationPercentageByDay", () => {
    it("should return empty response when no data is available", async () => {
      mockRepository.getMetricsByDateRange.mockResolvedValue([]);

      const result = await service.delegationPercentageByDay({
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(result).toEqual({
        items: [],
        totalCount: 0,
        hasNextPage: false,
        startDate: null,
        endDate: null,
      } satisfies DelegationPercentageServiceResult);
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

      mockRepository.getMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.delegationPercentageByDay({
        startDate: "1600041600",
        endDate: "1600041600",
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(result).toEqual({
        items: [{ date: "1600041600", high: "50.00" }],
        totalCount: 1,
        hasNextPage: false,
        startDate: "1600041600",
        endDate: "1600041600",
      } satisfies DelegationPercentageServiceResult);
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

      mockRepository.getMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.delegationPercentageByDay({
        startDate: day1.toString(),
        endDate: day3.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(result).toEqual({
        items: [
          { date: day1.toString(), high: "40.00" },
          { date: day2.toString(), high: "40.00" },
          { date: day3.toString(), high: "60.00" },
        ],
        totalCount: 3,
        hasNextPage: false,
        startDate: day1.toString(),
        endDate: day3.toString(),
      } satisfies DelegationPercentageServiceResult);
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

      mockRepository.getMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.delegationPercentageByDay({
        startDate: "1600041600",
        endDate: "1600041600",
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(result).toEqual({
        items: [{ date: "1600041600", high: "0.00" }],
        totalCount: 1,
        hasNextPage: false,
        startDate: "1600041600",
        endDate: "1600041600",
      } satisfies DelegationPercentageServiceResult);
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

      mockRepository.getMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.delegationPercentageByDay({
        startDate: "1600041600",
        endDate: "1600387200", // 5 days
        limit: 3,
        orderDirection: "asc" as const,
      });

      expect(result).toEqual({
        items: [
          { date: "1600041600", high: "50.00" },
          { date: "1600128000", high: "50.00" },
          { date: "1600214400", high: "50.00" },
        ],
        totalCount: 3,
        hasNextPage: true,
        startDate: "1600041600",
        endDate: "1600214400",
      } satisfies DelegationPercentageServiceResult);
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

      mockRepository.getMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.delegationPercentageByDay({
        startDate: "1600041600",
        endDate: "1600214400",
        orderDirection: "desc",
        limit: 365,
      });

      expect(result).toEqual({
        items: [
          { date: "1600214400", high: "50.00" },
          { date: "1600128000", high: "40.00" },
          { date: "1600041600", high: "30.00" },
        ],
        totalCount: 3,
        hasNextPage: false,
        startDate: "1600214400",
        endDate: "1600041600",
      } satisfies DelegationPercentageServiceResult);
    });

    it("should use default values when optional parameters are not provided", async () => {
      mockRepository.getMetricsByDateRange.mockResolvedValue([]);

      const result = await service.delegationPercentageByDay({
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(mockRepository.getMetricsByDateRange).toHaveBeenCalledWith({
        metricTypes: [
          MetricTypesEnum.DELEGATED_SUPPLY,
          MetricTypesEnum.TOTAL_SUPPLY,
        ],
        startDate: undefined,
        endDate: undefined,
        orderDirection: "asc",
        limit: 732,
      });
      expect(result).toEqual({
        items: [],
        totalCount: 0,
        hasNextPage: false,
        startDate: null,
        endDate: null,
      } satisfies DelegationPercentageServiceResult);
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

      mockRepository.getMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.delegationPercentageByDay({
        startDate: day1.toString(),
        endDate: day4.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(result).toEqual({
        items: [
          { date: day1.toString(), high: "25.00" },
          { date: day2.toString(), high: "12.50" },
          { date: day3.toString(), high: "25.00" },
          { date: day4.toString(), high: "25.00" },
        ],
        totalCount: 4,
        hasNextPage: false,
        startDate: day1.toString(),
        endDate: day4.toString(),
      } satisfies DelegationPercentageServiceResult);
    });

    it("should use last known values before startDate for forward-fill", async () => {
      const ONE_DAY = 86400;
      const day1 = 1599955200n;
      const day100 = day1 + BigInt(ONE_DAY * 100);
      const day105 = day100 + BigInt(ONE_DAY * 5);

      mockRepository.getLastMetricBeforeDate
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

      mockRepository.getMetricsByDateRange.mockResolvedValue([
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

      const result = await service.delegationPercentageByDay({
        startDate: day100.toString(),
        endDate: day105.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      const expectedItems = [];
      for (let i = 0; i < 5; i++) {
        expectedItems.push({
          date: (Number(day100) + i * ONE_DAY).toString(),
          high: "40.00",
        });
      }
      expectedItems.push({ date: day105.toString(), high: "60.00" });

      expect(result).toEqual({
        items: expectedItems,
        totalCount: 6,
        hasNextPage: false,
        startDate: day100.toString(),
        endDate: day105.toString(),
      } satisfies DelegationPercentageServiceResult);
    });

    it("should handle when only one metric has previous value", async () => {
      const ONE_DAY = 86400;
      const day50 = 1599955200n;
      const day100 = day50 + BigInt(ONE_DAY * 50);

      // Mock: only DELEGATED has previous value
      mockRepository.getLastMetricBeforeDate
        .mockResolvedValueOnce(
          createMockRow({
            date: day50,
            metricType: MetricTypesEnum.DELEGATED_SUPPLY,
            high: 30000000000000000000n,
          }),
        )
        .mockResolvedValueOnce(undefined);

      // Main data: TOTAL_SUPPLY appears on day 100
      mockRepository.getMetricsByDateRange.mockResolvedValue([
        createMockRow({
          date: day100,
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        }),
      ]);

      const result = await service.delegationPercentageByDay({
        startDate: day100.toString(),
        endDate: day100.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(result).toEqual({
        items: [{ date: day100.toString(), high: "30.00" }],
        totalCount: 1,
        hasNextPage: false,
        startDate: day100.toString(),
        endDate: day100.toString(),
      } satisfies DelegationPercentageServiceResult);
    });

    it("should start with 0% when no previous values exist", async () => {
      const day100 = 1599955200n;

      // Mock: no previous values
      mockRepository.getLastMetricBeforeDate
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      // Main data: appears only on day 100
      mockRepository.getMetricsByDateRange.mockResolvedValue([
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

      const result = await service.delegationPercentageByDay({
        startDate: day100.toString(),
        endDate: day100.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(result).toEqual({
        items: [{ date: day100.toString(), high: "50.00" }],
        totalCount: 1,
        hasNextPage: false,
        startDate: day100.toString(),
        endDate: day100.toString(),
      } satisfies DelegationPercentageServiceResult);
    });

    it("should not fetch previous values when neither startDate nor after is provided", async () => {
      mockRepository.getMetricsByDateRange.mockResolvedValue([]);

      const result = await service.delegationPercentageByDay({
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(result).toEqual({
        items: [],
        totalCount: 0,
        hasNextPage: false,
        startDate: null,
        endDate: null,
      } satisfies DelegationPercentageServiceResult);
    });

    it("should fallback to 0 when fetching previous values fails", async () => {
      const day100 = 1599955200n;

      // Mock console.error to suppress test output
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      // Mock: error fetching previous values
      mockRepository.getLastMetricBeforeDate.mockRejectedValue(
        new Error("Database error"),
      );

      // Main data
      mockRepository.getMetricsByDateRange.mockResolvedValue([
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

      const result = await service.delegationPercentageByDay({
        startDate: day100.toString(),
        endDate: day100.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(result).toEqual({
        items: [{ date: day100.toString(), high: "50.00" }],
        totalCount: 1,
        hasNextPage: false,
        startDate: day100.toString(),
        endDate: day100.toString(),
      } satisfies DelegationPercentageServiceResult);

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
      mockRepository.getLastMetricBeforeDate
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      // Real data starts on day 10
      mockRepository.getMetricsByDateRange.mockResolvedValue([
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

      const result = await service.delegationPercentageByDay({
        startDate: day5.toString(),
        endDate: day15.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      // Should start from day 10 (first real data), not day 5
      const expectedItems = [];
      for (let i = 0; i < 5; i++) {
        expectedItems.push({
          date: (Number(day10) + i * ONE_DAY).toString(),
          high: "40.00",
        });
      }
      expectedItems.push({ date: day15.toString(), high: "50.00" });

      expect(result).toEqual({
        items: expectedItems,
        totalCount: 6,
        hasNextPage: false,
        startDate: day10.toString(),
        endDate: day15.toString(),
      } satisfies DelegationPercentageServiceResult);
    });

    it("should return empty when startDate is after all available data", async () => {
      const day5 = 1599955200n;
      const day100 = day5 + BigInt(86400 * 100);

      // Mock: no values before day 100
      mockRepository.getLastMetricBeforeDate
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      // Mock: no data >= day 100
      mockRepository.getMetricsByDateRange.mockResolvedValue([]);

      const result = await service.delegationPercentageByDay({
        startDate: day100.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      expect(result).toEqual({
        items: [],
        totalCount: 0,
        hasNextPage: false,
        startDate: null,
        endDate: null,
      } satisfies DelegationPercentageServiceResult);
    });

    it("should fetch previous values and optimize query when only after is provided", async () => {
      const ONE_DAY = 86400;
      const day1 = 1599955200n;
      const day50 = day1 + BigInt(ONE_DAY * 50);
      const day100 = day50 + BigInt(ONE_DAY * 50);

      // Mock: values before day50
      mockRepository.getLastMetricBeforeDate
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
      mockRepository.getMetricsByDateRange.mockResolvedValue([
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

      const result = await service.delegationPercentageByDay({
        after: day50.toString(),
        limit: 365,
        orderDirection: "asc" as const,
      });

      // Verify query was optimized (used after as startDate)
      expect(mockRepository.getMetricsByDateRange).toHaveBeenCalledWith({
        metricTypes: [
          MetricTypesEnum.DELEGATED_SUPPLY,
          MetricTypesEnum.TOTAL_SUPPLY,
        ],
        startDate: day50.toString(),
        endDate: undefined,
        orderDirection: "asc",
        limit: 732,
      });

      // Verify previous values were fetched
      expect(mockRepository.getLastMetricBeforeDate).toHaveBeenCalledTimes(2);

      // Results should have correct forward-fill from previous values
      // From day50 to day100, forward-fill at 30%, then day100 = 50%
      // Plus forward-fill to today (FIXED_DATE)
      // Build expected items: day50+1 through day100 at 30%, day100 at 50%, then forward-fill to today at 50%
      const expectedItems = [];
      for (let d = Number(day50); d < Number(day100); d += ONE_DAY) {
        expectedItems.push({ date: d.toString(), high: "30.00" });
      }
      expectedItems.push({ date: day100.toString(), high: "50.00" });
      // Forward-fill to today
      for (
        let d = Number(day100) + ONE_DAY;
        d <= FIXED_TIMESTAMP;
        d += ONE_DAY
      ) {
        expectedItems.push({ date: d.toString(), high: "50.00" });
      }

      // Only first 365 items due to limit
      const limitedItems = expectedItems.slice(0, 365);
      const hasNextPage = expectedItems.length > 365;

      expect(result).toEqual({
        items: limitedItems,
        totalCount: limitedItems.length,
        hasNextPage,
        startDate: limitedItems[0]?.date ?? null,
        endDate: limitedItems[limitedItems.length - 1]?.date ?? null,
      } satisfies DelegationPercentageServiceResult);
    });

    it("should optimize query when only before is provided", async () => {
      const day1 = 1599955200n;
      const day50 = day1 + BigInt(86400 * 50);

      mockRepository.getMetricsByDateRange.mockResolvedValue([
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

      const result = await service.delegationPercentageByDay({
        before: day50.toString(),
        endDate: day50.toString(), // Add explicit endDate to prevent forward-fill to today
        limit: 365,
        orderDirection: "asc" as const,
      });

      // Verify query was optimized (used before as endDate)
      expect(mockRepository.getMetricsByDateRange).toHaveBeenCalledWith({
        metricTypes: [
          MetricTypesEnum.DELEGATED_SUPPLY,
          MetricTypesEnum.TOTAL_SUPPLY,
        ],
        startDate: undefined,
        endDate: day50.toString(),
        orderDirection: "asc",
        limit: 732,
      });

      // Should not fetch previous values (no startDate or after)
      expect(mockRepository.getLastMetricBeforeDate).not.toHaveBeenCalled();

      // With forward-fill, should generate from day1 to day50 (51 days including both endpoints)
      const ONE_DAY = 86400;
      const expectedItems = [];
      for (let d = Number(day1); d <= Number(day50); d += ONE_DAY) {
        expectedItems.push({ date: d.toString(), high: "30.00" });
      }

      expect(result).toEqual({
        items: expectedItems,
        totalCount: expectedItems.length,
        hasNextPage: false,
        startDate: day1.toString(),
        endDate: day50.toString(),
      } satisfies DelegationPercentageServiceResult);
    });

    it("should forward-fill to today when endDate is not provided", async () => {
      const ONE_DAY = 86400;
      const threeDaysAgoMidnight = FIXED_TIMESTAMP - 3 * ONE_DAY;

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

      mockRepository.getMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.delegationPercentageByDay({
        startDate: threeDaysAgoMidnight.toString(),
        // No endDate - should forward-fill to today
        limit: 10,
        orderDirection: "asc" as const,
      });

      // Should have data from 3 days ago until today (4 days total)
      const expectedItems = [];
      for (let i = 0; i <= 3; i++) {
        expectedItems.push({
          date: (threeDaysAgoMidnight + i * ONE_DAY).toString(),
          high: "50.00",
        });
      }

      expect(result).toEqual({
        items: expectedItems,
        totalCount: 4,
        hasNextPage: false,
        startDate: threeDaysAgoMidnight.toString(),
        endDate: FIXED_TIMESTAMP.toString(),
      } satisfies DelegationPercentageServiceResult);
    });

    it("should set hasNextPage to false when reaching today without endDate", async () => {
      const ONE_DAY = 86400;
      const twoDaysAgoMidnight = FIXED_TIMESTAMP - 2 * ONE_DAY;

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

      mockRepository.getMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.delegationPercentageByDay({
        startDate: twoDaysAgoMidnight.toString(),
        // No endDate, limit covers all days to today
        limit: 10,
        orderDirection: "asc" as const,
      });

      // Should have hasNextPage = false because we reached today
      expect(result).toEqual({
        items: [
          { date: twoDaysAgoMidnight.toString(), high: "50.00" },
          { date: (twoDaysAgoMidnight + ONE_DAY).toString(), high: "50.00" },
          { date: FIXED_TIMESTAMP.toString(), high: "50.00" },
        ],
        totalCount: 3,
        hasNextPage: false,
        startDate: twoDaysAgoMidnight.toString(),
        endDate: FIXED_TIMESTAMP.toString(),
      } satisfies DelegationPercentageServiceResult);
    });

    it("should set hasNextPage to true when limit cuts before today without endDate", async () => {
      const ONE_DAY = 86400;
      const tenDaysAgoMidnight = FIXED_TIMESTAMP - 10 * ONE_DAY;

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

      mockRepository.getMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.delegationPercentageByDay({
        startDate: tenDaysAgoMidnight.toString(),
        // No endDate, but limit only returns 3 items (not reaching today)
        limit: 3,
        orderDirection: "asc" as const,
      });

      expect(result).toEqual({
        items: [
          { date: tenDaysAgoMidnight.toString(), high: "50.00" },
          { date: (tenDaysAgoMidnight + ONE_DAY).toString(), high: "50.00" },
          {
            date: (tenDaysAgoMidnight + 2 * ONE_DAY).toString(),
            high: "50.00",
          },
        ],
        totalCount: 3,
        hasNextPage: true,
        startDate: tenDaysAgoMidnight.toString(),
        endDate: (tenDaysAgoMidnight + 2 * ONE_DAY).toString(),
      } satisfies DelegationPercentageServiceResult);
    });
  });
});
