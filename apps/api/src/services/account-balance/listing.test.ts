import { Address } from "viem";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { DaoIdEnum } from "@/lib/enums";
import { DBAccountBalanceWithVariation } from "@/mappers";

import { AccountBalanceService } from "./listing";

const MOCK_ADDRESS = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address;
const MOCK_TOKEN = "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984" as Address;
const MOCK_DELEGATE = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address;

const createMockBalance = (
  overrides: Partial<DBAccountBalanceWithVariation> = {},
): DBAccountBalanceWithVariation => ({
  accountId: MOCK_ADDRESS,
  tokenId: MOCK_TOKEN,
  delegate: MOCK_DELEGATE,
  previousBalance: 900n,
  currentBalance: 1000n,
  absoluteChange: 100n,
  percentageChange: "11.11",
  ...overrides,
});

describe("AccountBalanceService", () => {
  let service: AccountBalanceService;
  let mockRepo: {
    getAccountBalancesWithVariation: ReturnType<typeof vi.fn>;
    getAccountBalanceWithVariation: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockRepo = {
      getAccountBalancesWithVariation: vi.fn(),
      getAccountBalanceWithVariation: vi.fn(),
    };
    service = new AccountBalanceService(mockRepo);
  });

  describe("getAccountBalances", () => {
    it("should return items and totalCount from repo", async () => {
      const mockItems = [createMockBalance()];
      mockRepo.getAccountBalancesWithVariation.mockResolvedValue({
        items: mockItems,
        totalCount: 1n,
      });

      const result = await service.getAccountBalances(
        DaoIdEnum.UNI,
        0,
        1700000000,
        0,
        20,
        "desc",
        "balance",
        [],
        [],
        { minAmount: undefined, maxAmount: undefined },
      );

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(1n);
      expect(result.items[0]?.accountId).toBe(MOCK_ADDRESS);
    });

    it("should exclude treasury addresses for UNI DAO", async () => {
      mockRepo.getAccountBalancesWithVariation.mockResolvedValue({
        items: [],
        totalCount: 0n,
      });

      await service.getAccountBalances(
        DaoIdEnum.UNI,
        0,
        1700000000,
        0,
        20,
        "desc",
        "balance",
        [],
        [],
        { minAmount: undefined, maxAmount: undefined },
      );

      const [, , , , , , , , excludeAddresses] =
        mockRepo.getAccountBalancesWithVariation.mock.calls[0];

      expect(excludeAddresses.length).toBeGreaterThan(0);
    });

    it("should pass through filters to repository", async () => {
      mockRepo.getAccountBalancesWithVariation.mockResolvedValue({
        items: [],
        totalCount: 0n,
      });

      const amountFilter = {
        minAmount: 100n,
        maxAmount: 1000n,
      };

      await service.getAccountBalances(
        DaoIdEnum.ARB,
        1000000,
        1700000000,
        5,
        10,
        "asc",
        "variation",
        [MOCK_ADDRESS],
        [MOCK_DELEGATE],
        amountFilter,
      );

      expect(mockRepo.getAccountBalancesWithVariation).toHaveBeenCalledWith(
        1000000,
        1700000000,
        5,
        10,
        "asc",
        "variation",
        [MOCK_ADDRESS],
        [MOCK_DELEGATE],
        [],
        amountFilter,
      );
    });

    it("should return empty list when no balances exist", async () => {
      mockRepo.getAccountBalancesWithVariation.mockResolvedValue({
        items: [],
        totalCount: 0n,
      });

      const result = await service.getAccountBalances(
        DaoIdEnum.UNI,
        0,
        1700000000,
        0,
        20,
        "desc",
        "balance",
        [],
        [],
        { minAmount: undefined, maxAmount: undefined },
      );

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(0n);
    });
  });

  describe("getAccountBalanceWithVariation", () => {
    it("should return balance when account exists", async () => {
      const mockBalance = createMockBalance();
      mockRepo.getAccountBalanceWithVariation.mockResolvedValue(mockBalance);

      const result = await service.getAccountBalanceWithVariation(
        MOCK_ADDRESS,
        0,
        1700000000,
      );

      expect(result.accountId).toBe(MOCK_ADDRESS);
      expect(result.currentBalance).toBe(1000n);
      expect(result.absoluteChange).toBe(100n);
    });

    it("should throw when account is not found", async () => {
      mockRepo.getAccountBalanceWithVariation.mockResolvedValue(undefined);

      await expect(
        service.getAccountBalanceWithVariation(MOCK_ADDRESS, 0, 1700000000),
      ).rejects.toThrow("Account not found");
    });

    it("should pass correct params to repository", async () => {
      const mockBalance = createMockBalance();
      mockRepo.getAccountBalanceWithVariation.mockResolvedValue(mockBalance);

      await service.getAccountBalanceWithVariation(
        MOCK_ADDRESS,
        1000000,
        1700000000,
      );

      expect(mockRepo.getAccountBalanceWithVariation).toHaveBeenCalledWith(
        MOCK_ADDRESS,
        1000000,
        1700000000,
      );
    });

    it("should handle zero balances correctly", async () => {
      const zeroBalance = createMockBalance({
        previousBalance: 0n,
        currentBalance: 0n,
        absoluteChange: 0n,
        percentageChange: "0",
      });
      mockRepo.getAccountBalanceWithVariation.mockResolvedValue(zeroBalance);

      const result = await service.getAccountBalanceWithVariation(
        MOCK_ADDRESS,
        0,
        1700000000,
      );

      expect(result.currentBalance).toBe(0n);
      expect(result.absoluteChange).toBe(0n);
      expect(result.percentageChange).toBe("0");
    });
  });
});
