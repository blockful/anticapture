import { getAddress } from "viem";
import { describe, it, expect, beforeEach } from "vitest";
import {
  DBHistoricalVotingPowerWithRelations,
  DBAccountPowerWithVariation,
  AmountFilter,
} from "@/mappers";
import { AAVEVotingPowerService } from "./aave";

const MOCK_ADDRESS = getAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");

const createMockHistoricalVP = (
  overrides: Partial<DBHistoricalVotingPowerWithRelations> = {},
): DBHistoricalVotingPowerWithRelations => ({
  id: "test-id",
  transactionHash: "0xabc",
  daoId: "AAVE",
  accountId: MOCK_ADDRESS,
  votingPower: 1000n,
  delta: 100n,
  deltaMod: 0n,
  timestamp: 1700000000n,
  logIndex: 0,
  delegations: null,
  transfers: null,
  ...overrides,
});

const createMockAccountPower = (
  overrides: Partial<DBAccountPowerWithVariation> = {},
): DBAccountPowerWithVariation => ({
  id: "test-id",
  accountId: MOCK_ADDRESS,
  daoId: "AAVE",
  votingPower: 1000n,
  delegationsCount: 5,
  votesCount: 3,
  proposalsCount: 2,
  lastVoteTimestamp: 1700000000n,
  absoluteChange: 100n,
  percentageChange: "11.11",
  ...overrides,
});

function createStubRepo() {
  const stub = {
    historicalItems: [] as DBHistoricalVotingPowerWithRelations[],
    historicalCount: 0,
    votingPowers: { items: [] as DBAccountPowerWithVariation[], totalCount: 0 },
    byAccountId: undefined as DBAccountPowerWithVariation | undefined,
    getHistoricalVotingPowers: async () => stub.historicalItems,
    getHistoricalVotingPowerCount: async () => stub.historicalCount,
    getVotingPowers: async (
      _skip: number,
      _limit: number,
      _orderDirection: "asc" | "desc",
      _orderBy: string,
      _amountFilter: AmountFilter,
      _addresses: unknown[],
    ) => stub.votingPowers,
    getVotingPowersByAccountId: async () => stub.byAccountId!,
  };
  return stub;
}

describe("AAVEVotingPowerService", () => {
  let service: AAVEVotingPowerService;
  let repo: ReturnType<typeof createStubRepo>;

  beforeEach(() => {
    repo = createStubRepo();
    service = new AAVEVotingPowerService(repo);
  });

  describe("getHistoricalVotingPowers", () => {
    it("should return combined items and totalCount", async () => {
      repo.historicalItems = [createMockHistoricalVP()];
      repo.historicalCount = 1;

      const result = await service.getHistoricalVotingPowers(0, 20);

      expect(result).toEqual({
        items: [createMockHistoricalVP()],
        totalCount: 1,
      });
    });

    it("should return empty items with zero count", async () => {
      const result = await service.getHistoricalVotingPowers(0, 20);

      expect(result).toEqual({ items: [], totalCount: 0 });
    });
  });

  describe("getVotingPowers", () => {
    it("should return data from repo", async () => {
      repo.votingPowers = {
        items: [createMockAccountPower()],
        totalCount: 1,
      };

      const result = await service.getVotingPowers(
        0,
        20,
        "desc",
        "votingPower",
        { minAmount: undefined, maxAmount: undefined },
        [],
      );

      expect(result).toEqual({
        items: [createMockAccountPower()],
        totalCount: 1,
      });
    });
  });

  describe("getVotingPowersByAccountId", () => {
    it("should return data from repo", async () => {
      repo.byAccountId = createMockAccountPower();

      const result = await service.getVotingPowersByAccountId(MOCK_ADDRESS);

      expect(result).toEqual(createMockAccountPower());
    });
  });
});
