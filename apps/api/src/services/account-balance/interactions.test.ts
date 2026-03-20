import { getAddress, type Address } from "viem";
import { describe, it, expect, beforeEach } from "vitest";
import { AccountInteractions, Filter } from "@/mappers";
import { AccountInteractionsService } from "./interactions";

const MOCK_ACCOUNT = getAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");

function createStubRepo() {
  const stub: {
    result: AccountInteractions;
    lastLimit: number | undefined;
    lastSkip: number | undefined;
    getAccountInteractions: (
      _accountId: Address,
      _fromTs: number | undefined,
      _toTs: number | undefined,
      limit: number,
      skip: number,
      _orderBy: "volume" | "count",
      _orderDirection: "asc" | "desc",
      _filter: Filter,
    ) => Promise<AccountInteractions>;
  } = {
    result: { interactionCount: 0, interactions: [] },
    lastLimit: undefined,
    lastSkip: undefined,
    getAccountInteractions: async (
      _accountId,
      _fromTs,
      _toTs,
      limit,
      skip,
      _orderBy,
      _orderDirection,
      _filter,
    ) => {
      stub.lastLimit = limit;
      stub.lastSkip = skip;
      return stub.result;
    },
  };
  return stub;
}

describe("AccountInteractionsService", () => {
  let service: AccountInteractionsService;
  let repo: ReturnType<typeof createStubRepo>;

  beforeEach(() => {
    repo = createStubRepo();
    service = new AccountInteractionsService(repo);
  });

  it("should return interactions from repo", async () => {
    repo.result = {
      interactionCount: 2,
      interactions: [
        {
          accountId: MOCK_ACCOUNT,
          totalVolume: 1000n,
          transferCount: 5n,
          previousBalance: 0n,
          currentBalance: 1000n,
          absoluteChange: 1000n,
          percentageChange: "100",
        },
      ],
    };

    const result = await service.getAccountInteractions(
      MOCK_ACCOUNT,
      1000000,
      1700000000,
      0,
      20,
      "volume",
      "desc",
      {},
    );

    expect(result).toEqual(repo.result);
  });

  it("should return empty interactions", async () => {
    const result = await service.getAccountInteractions(
      MOCK_ACCOUNT,
      undefined,
      undefined,
      0,
      20,
      "count",
      "asc",
      {},
    );

    expect(result).toEqual({ interactionCount: 0, interactions: [] });
  });

  it("should swap limit and skip when calling repo", async () => {
    await service.getAccountInteractions(
      MOCK_ACCOUNT,
      1000000,
      1700000000,
      5, // skip
      10, // limit
      "volume",
      "desc",
      { minAmount: 100n },
    );

    // Service passes (limit, skip) to repo — swapped order
    expect(repo.lastLimit).toBe(10);
    expect(repo.lastSkip).toBe(5);
  });
});
