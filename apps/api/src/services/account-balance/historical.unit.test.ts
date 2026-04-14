import { getAddress } from "viem";
import { describe, it, expect, beforeEach } from "vitest";
import { DBHistoricalBalanceWithRelations } from "@/mappers";
import { HistoricalBalancesService } from "./historical";

const MOCK_ACCOUNT = getAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");

const createMockHistoricalBalance = (
  overrides: Partial<DBHistoricalBalanceWithRelations> = {},
): DBHistoricalBalanceWithRelations => ({
  id: "test-id",
  transactionHash: "0xabc",
  daoId: "UNI",
  accountId: MOCK_ACCOUNT,
  balance: 1000n,
  delta: 100n,
  deltaMod: 0n,
  timestamp: 1700000000n,
  logIndex: 0,
  transfer: {
    id: "test-id",
    transactionHash: "0xabc",
    daoId: "UNI",
    tokenId: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    amount: 100n,
    fromAccountId: "0x0000000000000000000000000000000000000000",
    toAccountId: MOCK_ACCOUNT,
    timestamp: 1700000000n,
    logIndex: 0,
    isCex: false,
    isDex: false,
    isLending: false,
    isTotal: false,
  },
  ...overrides,
});

function createStubRepo() {
  const stub = {
    items: [] as DBHistoricalBalanceWithRelations[],
    count: 0,

    getHistoricalBalances: async () => stub.items,
    getHistoricalBalanceCount: async () => stub.count,
  };
  return stub;
}

describe("HistoricalBalancesService", () => {
  let service: HistoricalBalancesService;
  let repo: ReturnType<typeof createStubRepo>;

  beforeEach(() => {
    repo = createStubRepo();
    service = new HistoricalBalancesService(repo);
  });

  it("should return combined items and totalCount", async () => {
    repo.items = [createMockHistoricalBalance()];
    repo.count = 1;

    const result = await service.getHistoricalBalances(MOCK_ACCOUNT, 0, 20);

    expect(result).toEqual({
      items: repo.items,
      totalCount: 1,
    });
  });

  it("should return empty items with zero count", async () => {
    const result = await service.getHistoricalBalances(MOCK_ACCOUNT, 0, 20);

    expect(result).toEqual({
      items: [],
      totalCount: 0,
    });
  });
});
