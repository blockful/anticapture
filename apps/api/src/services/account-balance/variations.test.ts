import { Address } from "viem";
import { describe, it, expect, beforeEach, vi } from "vitest";

import { DBAccountBalanceVariation, DBAccountBalance } from "@/mappers";

import { BalanceVariationsService } from "./variations";

const ADDR_A = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address;
const ADDR_B = "0x1234567890123456789012345678901234567890" as Address;
const MOCK_TOKEN = "0x1f9840a85d5aF5bf1D1762F925BDAaDdC4201F984" as Address;

const createMockVariation = (
  overrides: Partial<DBAccountBalanceVariation> = {},
): DBAccountBalanceVariation => ({
  accountId: ADDR_A,
  previousBalance: 900n,
  currentBalance: 1000n,
  absoluteChange: 100n,
  percentageChange: "11.11",
  ...overrides,
});

const createMockBalance = (
  overrides: Partial<DBAccountBalance> = {},
): DBAccountBalance =>
  ({
    accountId: ADDR_A,
    tokenId: MOCK_TOKEN,
    balance: 500n,
    delegate: ADDR_A,
    lastUpdate: 0n,
    daoId: "uni",
    ...overrides,
  }) as unknown as DBAccountBalance;

describe("BalanceVariationsService", () => {
  let service: BalanceVariationsService;
  let mockVariationsRepo: {
    getAccountBalanceVariations: ReturnType<typeof vi.fn>;
    getAccountBalanceVariationsByAccountId: ReturnType<typeof vi.fn>;
  };
  let mockInteractionsRepo: {
    getAccountInteractions: ReturnType<typeof vi.fn>;
  };
  let mockBalanceRepo: {
    getAccountBalance: ReturnType<typeof vi.fn>;
    getAccountBalances: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    mockVariationsRepo = {
      getAccountBalanceVariations: vi.fn(),
      getAccountBalanceVariationsByAccountId: vi.fn(),
    };
    mockInteractionsRepo = {
      getAccountInteractions: vi.fn(),
    };
    mockBalanceRepo = {
      getAccountBalance: vi.fn(),
      getAccountBalances: vi.fn(),
    };

    service = new BalanceVariationsService(
      mockVariationsRepo,
      mockInteractionsRepo,
      mockBalanceRepo,
    );
  });

  describe("getAccountBalanceVariations", () => {
    it("should return variations from repo when no address filter", async () => {
      const mockVariations = [createMockVariation()];
      mockVariationsRepo.getAccountBalanceVariations.mockResolvedValue(
        mockVariations,
      );

      const result = await service.getAccountBalanceVariations(
        undefined,
        undefined,
        0,
        20,
        "desc",
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.accountId).toBe(ADDR_A);
    });

    it("should return variations directly when no addresses filter provided", async () => {
      const mockVariations = [
        createMockVariation({ accountId: ADDR_A }),
        createMockVariation({ accountId: ADDR_B }),
      ];
      mockVariationsRepo.getAccountBalanceVariations.mockResolvedValue(
        mockVariations,
      );

      const result = await service.getAccountBalanceVariations(
        0,
        1700000000,
        0,
        20,
        "desc",
      );

      expect(result).toHaveLength(2);
      expect(mockBalanceRepo.getAccountBalances).not.toHaveBeenCalled();
    });

    it("should fill missing addresses with zero variation when address filter provided", async () => {
      mockVariationsRepo.getAccountBalanceVariations.mockResolvedValue([
        createMockVariation({ accountId: ADDR_A }),
      ]);

      mockBalanceRepo.getAccountBalances.mockResolvedValue({
        items: [createMockBalance({ accountId: ADDR_B, balance: 200n })],
        totalCount: 1n,
      });

      const result = await service.getAccountBalanceVariations(
        0,
        1700000000,
        0,
        20,
        "desc",
        [ADDR_A, ADDR_B],
      );

      expect(result).toHaveLength(2);
      const addrBResult = result.find((r) => r.accountId === ADDR_B);
      expect(addrBResult?.absoluteChange).toBe(0n);
      expect(addrBResult?.previousBalance).toBe(200n);
      expect(addrBResult?.currentBalance).toBe(200n);
      expect(addrBResult?.percentageChange).toBe("0");
    });

    it("should use zero balance when address not in balances table either", async () => {
      mockVariationsRepo.getAccountBalanceVariations.mockResolvedValue([]);
      mockBalanceRepo.getAccountBalances.mockResolvedValue({
        items: [],
        totalCount: 0n,
      });

      const result = await service.getAccountBalanceVariations(
        0,
        1700000000,
        0,
        20,
        "desc",
        [ADDR_A],
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.accountId).toBe(ADDR_A);
      expect(result[0]?.previousBalance).toBe(0n);
      expect(result[0]?.currentBalance).toBe(0n);
      expect(result[0]?.absoluteChange).toBe(0n);
    });

    it("should preserve order of requested addresses", async () => {
      mockVariationsRepo.getAccountBalanceVariations.mockResolvedValue([
        createMockVariation({ accountId: ADDR_B }),
      ]);
      mockBalanceRepo.getAccountBalances.mockResolvedValue({
        items: [createMockBalance({ accountId: ADDR_A })],
        totalCount: 1n,
      });

      const result = await service.getAccountBalanceVariations(
        0,
        1700000000,
        0,
        20,
        "desc",
        [ADDR_A, ADDR_B],
      );

      expect(result[0]?.accountId).toBe(ADDR_A);
      expect(result[1]?.accountId).toBe(ADDR_B);
    });

    it("should return empty array when repo returns empty", async () => {
      mockVariationsRepo.getAccountBalanceVariations.mockResolvedValue([]);

      const result = await service.getAccountBalanceVariations(
        0,
        1700000000,
        0,
        20,
        "desc",
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("getAccountBalanceVariationsByAccountId", () => {
    it("should return variation from repo when found", async () => {
      const mockVariation = createMockVariation();
      mockVariationsRepo.getAccountBalanceVariationsByAccountId.mockResolvedValue(
        mockVariation,
      );

      const result = await service.getAccountBalanceVariationsByAccountId(
        ADDR_A,
        0,
        1700000000,
      );

      expect(result.accountId).toBe(ADDR_A);
      expect(result.absoluteChange).toBe(100n);
    });

    it("should fall back to balance with zero change when variation not found", async () => {
      mockVariationsRepo.getAccountBalanceVariationsByAccountId.mockResolvedValue(
        undefined,
      );
      mockBalanceRepo.getAccountBalance.mockResolvedValue(
        createMockBalance({ balance: 750n }),
      );

      const result = await service.getAccountBalanceVariationsByAccountId(
        ADDR_A,
        0,
        1700000000,
      );

      expect(result.accountId).toBe(ADDR_A);
      expect(result.previousBalance).toBe(750n);
      expect(result.currentBalance).toBe(750n);
      expect(result.absoluteChange).toBe(0n);
      expect(result.percentageChange).toBe("0");
    });

    it("should return zero balance when neither variation nor balance found", async () => {
      mockVariationsRepo.getAccountBalanceVariationsByAccountId.mockResolvedValue(
        undefined,
      );
      mockBalanceRepo.getAccountBalance.mockResolvedValue(undefined);

      const result = await service.getAccountBalanceVariationsByAccountId(
        ADDR_A,
        0,
        1700000000,
      );

      expect(result.previousBalance).toBe(0n);
      expect(result.currentBalance).toBe(0n);
      expect(result.absoluteChange).toBe(0n);
      expect(result.percentageChange).toBe("0");
    });

    it("should pass correct params to repo", async () => {
      const mockVariation = createMockVariation();
      mockVariationsRepo.getAccountBalanceVariationsByAccountId.mockResolvedValue(
        mockVariation,
      );

      await service.getAccountBalanceVariationsByAccountId(
        ADDR_A,
        1000000,
        1700000000,
      );

      expect(
        mockVariationsRepo.getAccountBalanceVariationsByAccountId,
      ).toHaveBeenCalledWith(ADDR_A, 1000000, 1700000000);
    });
  });
});
