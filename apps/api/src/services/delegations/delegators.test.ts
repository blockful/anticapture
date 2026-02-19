import { describe, it, expect, beforeEach, vi } from "vitest";
import { Address } from "viem";
import { DelegatorsService } from "./delegators";
import { AggregatedDelegator } from "@/mappers";

const createMockAggregatedDelegator = (
  overrides: Partial<AggregatedDelegator> = {},
): AggregatedDelegator => ({
  delegatorAddress: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd" as Address,
  amount: 1000000000000000000n,
  timestamp: 1700000000n,
  ...overrides,
});

const defaultSort = { orderBy: "amount" as const, orderDirection: "desc" as const };

describe("DelegatorsService", () => {
  const address = "0x1234567890123456789012345678901234567890" as Address;

  let stubRepository: { getDelegators: ReturnType<typeof vi.fn> };
  let service: DelegatorsService;

  beforeEach(() => {
    stubRepository = {
      getDelegators: vi.fn(),
    };
    service = new DelegatorsService(stubRepository);
  });

  describe("getDelegators", () => {
    it("should pass address, skip, limit, and sort to the repository", async () => {
      stubRepository.getDelegators.mockResolvedValue({
        items: [],
        totalCount: 0,
      });

      await service.getDelegators(address, 5, 20, defaultSort);

      expect(stubRepository.getDelegators).toHaveBeenCalledWith(
        address,
        5,
        20,
        defaultSort,
      );
    });

    it("should return the repository result unchanged", async () => {
      const delegators = [createMockAggregatedDelegator()];
      stubRepository.getDelegators.mockResolvedValue({
        items: delegators,
        totalCount: 1,
      });

      const result = await service.getDelegators(address, 0, 10, defaultSort);

      expect(result).toEqual({ items: delegators, totalCount: 1 });
    });

    it("should return empty items when repository returns no data", async () => {
      stubRepository.getDelegators.mockResolvedValue({
        items: [],
        totalCount: 0,
      });

      const result = await service.getDelegators(address, 0, 10, defaultSort);

      expect(result.items).toEqual([]);
      expect(result.totalCount).toBe(0);
    });

    it("should forward sort options to repository", async () => {
      stubRepository.getDelegators.mockResolvedValue({
        items: [],
        totalCount: 0,
      });
      const sort = { orderBy: "timestamp" as const, orderDirection: "asc" as const };

      await service.getDelegators(address, 0, 10, sort);

      expect(stubRepository.getDelegators).toHaveBeenCalledWith(
        address,
        0,
        10,
        sort,
      );
    });

    it("should return multiple delegators from repository", async () => {
      const delegators = [
        createMockAggregatedDelegator({
          delegatorAddress:
            "0x1111111111111111111111111111111111111111" as Address,
        }),
        createMockAggregatedDelegator({
          delegatorAddress:
            "0x2222222222222222222222222222222222222222" as Address,
        }),
        createMockAggregatedDelegator({
          delegatorAddress:
            "0x3333333333333333333333333333333333333333" as Address,
        }),
      ];
      stubRepository.getDelegators.mockResolvedValue({
        items: delegators,
        totalCount: 3,
      });

      const result = await service.getDelegators(address, 0, 10, defaultSort);

      expect(result.items).toHaveLength(3);
      expect(result.totalCount).toBe(3);
    });
  });
});
