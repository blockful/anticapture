import { getAddress } from "viem";
import { describe, it, expect, beforeEach } from "vitest";
import { DBAccountBalanceVariation, DBAccountBalance } from "@/mappers";
import { BalanceVariationsService } from "./variations";

const ADDR_A = getAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
const ADDR_B = getAddress("0x1234567890123456789012345678901234567890");
const MOCK_TOKEN = getAddress("0x1f9840a85d5af5bf1d1762f925bdaaddc4201f98");

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
): DBAccountBalance => ({
  id: "test-id",
  accountId: ADDR_A,
  tokenId: MOCK_TOKEN,
  balance: 500n,
  delegate: ADDR_A,
  ...overrides,
});

function createStubVariationsRepo() {
  const stub: {
    items: DBAccountBalanceVariation[];
    byIdItem: DBAccountBalanceVariation | undefined;
    getAccountBalanceVariations: () => Promise<DBAccountBalanceVariation[]>;
    getAccountBalanceVariationsByAccountId: () => Promise<
      DBAccountBalanceVariation | undefined
    >;
  } = {
    items: [],
    byIdItem: undefined,
    getAccountBalanceVariations: async () => stub.items,
    getAccountBalanceVariationsByAccountId: async () => stub.byIdItem,
  };
  return stub;
}

function createStubBalanceRepo() {
  const stub: {
    balances: DBAccountBalance[];
    singleBalance: DBAccountBalance | undefined;
    getAccountBalancesCallCount: number;
    getAccountBalance: () => Promise<DBAccountBalance | undefined>;
    getAccountBalances: () => Promise<{
      items: DBAccountBalance[];
      totalCount: number;
    }>;
  } = {
    balances: [],
    singleBalance: undefined,
    getAccountBalancesCallCount: 0,
    getAccountBalance: async () => stub.singleBalance,
    getAccountBalances: async () => {
      stub.getAccountBalancesCallCount++;
      return { items: stub.balances, totalCount: 0 };
    },
  };
  return stub;
}

describe("BalanceVariationsService", () => {
  let service: BalanceVariationsService;
  let variationsRepo: ReturnType<typeof createStubVariationsRepo>;
  let balanceRepo: ReturnType<typeof createStubBalanceRepo>;

  beforeEach(() => {
    variationsRepo = createStubVariationsRepo();
    balanceRepo = createStubBalanceRepo();
    service = new BalanceVariationsService(variationsRepo, balanceRepo);
  });

  describe("getAccountBalanceVariations", () => {
    it("should return variations from repo when no address filter", async () => {
      variationsRepo.items = [createMockVariation()];

      const result = await service.getAccountBalanceVariations(
        undefined,
        undefined,
        0,
        20,
        "desc",
      );

      expect(result).toEqual([createMockVariation()]);
    });

    it("should return variations directly when no addresses filter provided", async () => {
      variationsRepo.items = [
        createMockVariation({ accountId: ADDR_A }),
        createMockVariation({ accountId: ADDR_B }),
      ];

      const result = await service.getAccountBalanceVariations(
        0,
        1700000000,
        0,
        20,
        "desc",
      );

      expect(result).toEqual([
        createMockVariation(),
        createMockVariation({ accountId: ADDR_B }),
      ]);
      expect(balanceRepo.getAccountBalancesCallCount).toBe(0);
    });

    it("should fill missing addresses with zero variation when address filter provided", async () => {
      variationsRepo.items = [createMockVariation({ accountId: ADDR_A })];
      balanceRepo.balances = [
        createMockBalance({ accountId: ADDR_B, balance: 200n }),
      ];

      const result = await service.getAccountBalanceVariations(
        0,
        1700000000,
        0,
        20,
        "desc",
        [ADDR_A, ADDR_B],
      );

      expect(result).toEqual([
        createMockVariation(),
        {
          accountId: ADDR_B,
          previousBalance: 200n,
          currentBalance: 200n,
          absoluteChange: 0n,
          percentageChange: "0",
        },
      ]);
    });

    it("should use zero balance when address not in balances table either", async () => {
      const result = await service.getAccountBalanceVariations(
        0,
        1700000000,
        0,
        20,
        "desc",
        [ADDR_A],
      );

      expect(result).toEqual([
        {
          accountId: ADDR_A,
          previousBalance: 0n,
          currentBalance: 0n,
          absoluteChange: 0n,
          percentageChange: "0",
        },
      ]);
    });

    it("should preserve order of requested addresses", async () => {
      variationsRepo.items = [createMockVariation({ accountId: ADDR_B })];
      balanceRepo.balances = [createMockBalance({ accountId: ADDR_A })];

      const result = await service.getAccountBalanceVariations(
        0,
        1700000000,
        0,
        20,
        "desc",
        [ADDR_A, ADDR_B],
      );

      expect(result).toEqual([
        {
          accountId: ADDR_A,
          previousBalance: 500n,
          currentBalance: 500n,
          absoluteChange: 0n,
          percentageChange: "0",
        },
        createMockVariation({ accountId: ADDR_B }),
      ]);
    });

    it("should return empty array when repo returns empty", async () => {
      const result = await service.getAccountBalanceVariations(
        0,
        1700000000,
        0,
        20,
        "desc",
      );

      expect(result).toEqual([]);
    });
  });

  describe("getAccountBalanceVariationsByAccountId", () => {
    it("should return variation from repo when found", async () => {
      variationsRepo.byIdItem = createMockVariation();

      const result = await service.getAccountBalanceVariationsByAccountId(
        ADDR_A,
        0,
        1700000000,
      );

      expect(result).toEqual(createMockVariation());
    });

    it("should fall back to balance with zero change when variation not found", async () => {
      balanceRepo.singleBalance = createMockBalance({ balance: 750n });

      const result = await service.getAccountBalanceVariationsByAccountId(
        ADDR_A,
        0,
        1700000000,
      );

      expect(result).toEqual({
        accountId: ADDR_A,
        previousBalance: 750n,
        currentBalance: 750n,
        absoluteChange: 0n,
        percentageChange: "0",
      });
    });

    it("should return zero balance when neither variation nor balance found", async () => {
      const result = await service.getAccountBalanceVariationsByAccountId(
        ADDR_A,
        0,
        1700000000,
      );

      expect(result).toEqual({
        accountId: ADDR_A,
        previousBalance: 0n,
        currentBalance: 0n,
        absoluteChange: 0n,
        percentageChange: "0",
      });
    });
  });
});
