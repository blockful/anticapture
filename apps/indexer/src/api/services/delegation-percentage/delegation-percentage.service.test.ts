import { DelegationPercentageService } from "./delegation-percentage.service";
import {
  DelegationPercentageRepository,
  DaoMetricRow,
} from "@/api/repositories/delegation-percentage.repository";
import { MetricTypesEnum } from "@/lib/constants";

describe("DelegationPercentageService", () => {
  let service: DelegationPercentageService;
  let mockRepository: jest.Mocked<DelegationPercentageRepository>;

  beforeEach(() => {
    mockRepository = {
      getDaoMetricsByDateRange: jest.fn(),
    } as jest.Mocked<DelegationPercentageRepository>;

    service = new DelegationPercentageService(mockRepository);
  });

  describe("getDelegationPercentage", () => {
    it("should return empty response when no data is available", async () => {
      mockRepository.getDaoMetricsByDateRange.mockResolvedValue([]);

      const result = await service.getDelegationPercentage({});

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0);
      expect(result.pageInfo.hasNextPage).toBe(false);
      expect(result.pageInfo.hasPreviousPage).toBe(false);
      expect(result.pageInfo.startCursor).toBeNull();
      expect(result.pageInfo.endCursor).toBeNull();
    });

    it("should calculate delegation percentage correctly", async () => {
      const mockRows: DaoMetricRow[] = [
        {
          date: 1600041600n,
          daoId: "uniswap",
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 50000000000000000000n, // 50 tokens delegated
        },
        {
          date: 1600041600n,
          daoId: "uniswap",
          tokenId: "uni",
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n, // 100 tokens total
        },
      ];

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: "1600041600",
        endDate: "1600041600",
      });

      expect(result.items).toHaveLength(1);
      // 50/100 = 0.5 = 50% = 50 * 1e18 = 50000000000000000000
      expect(result.items[0]?.high).toBe("50000000000000000000");
      expect(result.items[0]?.date).toBe("1600041600");
    });

    it("should apply forward-fill for missing dates", async () => {
      const ONE_DAY = 86400;
      const day1 = 1600041600n;
      const day2 = day1 + BigInt(ONE_DAY);
      const day3 = day2 + BigInt(ONE_DAY);

      const mockRows: DaoMetricRow[] = [
        // Day 1: 40% delegation
        {
          date: day1,
          daoId: "uniswap",
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 40000000000000000000n,
        },
        {
          date: day1,
          daoId: "uniswap",
          tokenId: "uni",
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        },
        // Day 3: 60% delegation (day 2 is missing)
        {
          date: day3,
          daoId: "uniswap",
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 60000000000000000000n,
        },
        {
          date: day3,
          daoId: "uniswap",
          tokenId: "uni",
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        },
      ];

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: day1.toString(),
        endDate: day3.toString(),
      });

      expect(result.items).toHaveLength(3);
      // Day 1: 40%
      expect(result.items[0]?.high).toBe("40000000000000000000");
      // Day 2: forward-filled from day 1 = 40%
      expect(result.items[1]?.high).toBe("40000000000000000000");
      expect(result.items[1]?.date).toBe(day2.toString());
      // Day 3: 60%
      expect(result.items[2]?.high).toBe("60000000000000000000");
    });

    it("should handle division by zero when total supply is zero", async () => {
      const mockRows: DaoMetricRow[] = [
        {
          date: 1600041600n,
          daoId: "uniswap",
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 50000000000000000000n,
        },
        {
          date: 1600041600n,
          daoId: "uniswap",
          tokenId: "uni",
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 0n, // zero total supply
        },
      ];

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: "1600041600",
        endDate: "1600041600",
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.high).toBe("0"); // Should be 0 instead of throwing error
    });

    it("should apply pagination with limit", async () => {
      const ONE_DAY = 86400;
      const mockRows: DaoMetricRow[] = [];

      // Create 5 days of data
      for (let i = 0; i < 5; i++) {
        const date = BigInt(1600041600 + i * ONE_DAY);
        mockRows.push(
          {
            date,
            daoId: "uniswap",
            tokenId: "uni",
            metricType: MetricTypesEnum.DELEGATED_SUPPLY,
            high: 50000000000000000000n,
          },
          {
            date,
            daoId: "uniswap",
            tokenId: "uni",
            metricType: MetricTypesEnum.TOTAL_SUPPLY,
            high: 100000000000000000000n,
          },
        );
      }

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: "1600041600",
        endDate: "1600387200", // 5 days
        limit: 3,
      });

      expect(result.items).toHaveLength(3);
      expect(result.pageInfo.hasNextPage).toBe(true);
      expect(result.pageInfo.startCursor).toBe("1600041600");
      expect(result.pageInfo.endCursor).toBe("1600214400");
    });

    it("should apply cursor-based pagination with after", async () => {
      const ONE_DAY = 86400;
      const mockRows: DaoMetricRow[] = [];

      // Create 5 days of data
      for (let i = 0; i < 5; i++) {
        const date = BigInt(1600041600 + i * ONE_DAY);
        mockRows.push(
          {
            date,
            daoId: "uniswap",
            tokenId: "uni",
            metricType: MetricTypesEnum.DELEGATED_SUPPLY,
            high: 50000000000000000000n,
          },
          {
            date,
            daoId: "uniswap",
            tokenId: "uni",
            metricType: MetricTypesEnum.TOTAL_SUPPLY,
            high: 100000000000000000000n,
          },
        );
      }

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: "1600041600",
        endDate: "1600387200",
        after: "1600128000", // After day 2
        limit: 2,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.date).toBe("1600214400"); // Day 3
      expect(result.items[1]?.date).toBe("1600300800"); // Day 4
      expect(result.pageInfo.hasPreviousPage).toBe(true);
    });

    it("should apply cursor-based pagination with before", async () => {
      const ONE_DAY = 86400;
      const mockRows: DaoMetricRow[] = [];

      // Create 5 days of data
      for (let i = 0; i < 5; i++) {
        const date = BigInt(1600041600 + i * ONE_DAY);
        mockRows.push(
          {
            date,
            daoId: "uniswap",
            tokenId: "uni",
            metricType: MetricTypesEnum.DELEGATED_SUPPLY,
            high: 50000000000000000000n,
          },
          {
            date,
            daoId: "uniswap",
            tokenId: "uni",
            metricType: MetricTypesEnum.TOTAL_SUPPLY,
            high: 100000000000000000000n,
          },
        );
      }

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: "1600041600",
        endDate: "1600387200",
        before: "1600214400", // Before day 3
        limit: 2,
      });

      expect(result.items).toHaveLength(2);
      expect(result.items[0]?.date).toBe("1600041600"); // Day 1
      expect(result.items[1]?.date).toBe("1600128000"); // Day 2
      expect(result.pageInfo.hasPreviousPage).toBe(true);
    });

    it("should sort data in descending order when specified", async () => {
      const ONE_DAY = 86400;
      const mockRows: DaoMetricRow[] = [];

      // Create 3 days of data
      for (let i = 0; i < 3; i++) {
        const date = BigInt(1600041600 + i * ONE_DAY);
        mockRows.push(
          {
            date,
            daoId: "uniswap",
            tokenId: "uni",
            metricType: MetricTypesEnum.DELEGATED_SUPPLY,
            high: BigInt(30 + i * 10) * BigInt(1e18),
          },
          {
            date,
            daoId: "uniswap",
            tokenId: "uni",
            metricType: MetricTypesEnum.TOTAL_SUPPLY,
            high: 100000000000000000000n,
          },
        );
      }

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: "1600041600",
        endDate: "1600214400",
        orderDirection: "desc",
      });

      expect(result.items).toHaveLength(3);
      // Should be in descending order
      expect(result.items[0]?.date).toBe("1600214400"); // Day 3
      expect(result.items[1]?.date).toBe("1600128000"); // Day 2
      expect(result.items[2]?.date).toBe("1600041600"); // Day 1
    });

    it("should use default values when optional parameters are not provided", async () => {
      mockRepository.getDaoMetricsByDateRange.mockResolvedValue([]);

      const result = await service.getDelegationPercentage({});

      expect(mockRepository.getDaoMetricsByDateRange).toHaveBeenCalledWith({
        startDate: undefined,
        endDate: undefined,
        orderDirection: "asc",
      });
      expect(result.items).toHaveLength(0);
    });

    it("should handle complex scenario with multiple days and changing values", async () => {
      const ONE_DAY = 86400;
      const day1 = 1600041600n;
      const day2 = day1 + BigInt(ONE_DAY);
      const day3 = day2 + BigInt(ONE_DAY);
      const day4 = day3 + BigInt(ONE_DAY);

      const mockRows: DaoMetricRow[] = [
        // Day 1: 25% (25/100)
        {
          date: day1,
          daoId: "uniswap",
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 25000000000000000000n,
        },
        {
          date: day1,
          daoId: "uniswap",
          tokenId: "uni",
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 100000000000000000000n,
        },
        // Day 2: only total supply changes to 200 -> 25/200 = 12.5%
        {
          date: day2,
          daoId: "uniswap",
          tokenId: "uni",
          metricType: MetricTypesEnum.TOTAL_SUPPLY,
          high: 200000000000000000000n,
        },
        // Day 3: delegated changes to 50 -> 50/200 = 25%
        {
          date: day3,
          daoId: "uniswap",
          tokenId: "uni",
          metricType: MetricTypesEnum.DELEGATED_SUPPLY,
          high: 50000000000000000000n,
        },
        // Day 4: no changes -> forward fill 50/200 = 25%
      ];

      mockRepository.getDaoMetricsByDateRange.mockResolvedValue(mockRows);

      const result = await service.getDelegationPercentage({
        startDate: day1.toString(),
        endDate: day4.toString(),
      });

      expect(result.items).toHaveLength(4);
      // Day 1: 25%
      expect(result.items[0]?.high).toBe("25000000000000000000");
      // Day 2: 12.5% (25/200)
      expect(result.items[1]?.high).toBe("12500000000000000000");
      // Day 3: 25% (50/200)
      expect(result.items[2]?.high).toBe("25000000000000000000");
      // Day 4: 25% (forward-filled)
      expect(result.items[3]?.high).toBe("25000000000000000000");
    });
  });
});
