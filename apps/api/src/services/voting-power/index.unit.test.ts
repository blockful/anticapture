import { Address } from "viem";
import { describe, it, expect } from "vitest";
import {
  AmountFilter,
  DBAccountPowerWithVariation,
  DBHistoricalVotingPowerWithRelations,
  DBVotingPowerVariation,
} from "@/mappers";
import { VotingPowerService } from "./index";

function createStubHistoricalRepo(
  items: DBHistoricalVotingPowerWithRelations[] = [],
  count = 0,
) {
  return {
    getHistoricalVotingPowers: async () => items,
    getHistoricalVotingPowerCount: async () => count,
  };
}

function createStubVotingPowersRepo(
  variations: DBVotingPowerVariation[] = [],
  variationByAccountId: DBVotingPowerVariation | null = null,
  votingPowersResult: {
    items: DBAccountPowerWithVariation[];
    totalCount: number;
  } = { items: [], totalCount: 0 },
  votingPowerByAccountId: DBAccountPowerWithVariation | null = null,
) {
  return {
    getVotingPowerVariations: async () => variations,
    getVotingPowerVariationsByAccountId: async () => variationByAccountId!,
    getVotingPowers: async () => votingPowersResult,
    getVotingPowersByAccountId: async () => votingPowerByAccountId!,
  };
}

const makeDBHistoricalVotingPower = (
  overrides = {},
): DBHistoricalVotingPowerWithRelations => ({
  id: "test-id",
  transactionHash: "0xabc",
  daoId: "UNI",
  accountId: "0x1111111111111111111111111111111111111111" as Address,
  votingPower: 1000n,
  delta: 100n,
  deltaMod: 100n,
  timestamp: 1700000000n,
  logIndex: 0,
  delegations: null,
  transfers: null,
  ...overrides,
});

const makeDBVotingPowerVariation = (
  accountId: Address,
  overrides = {},
): DBVotingPowerVariation => ({
  accountId,
  previousVotingPower: 1000n,
  currentVotingPower: 1100n,
  absoluteChange: 100n,
  percentageChange: "10",
  ...overrides,
});

describe("VotingPowerService (index)", () => {
  const addr1 = "0x1111111111111111111111111111111111111111" as Address;
  const addr2 = "0x2222222222222222222222222222222222222222" as Address;

  describe("getHistoricalVotingPowers", () => {
    it("returns items and totalCount from both repo calls", async () => {
      const items = [makeDBHistoricalVotingPower()];
      const service = new VotingPowerService(
        createStubHistoricalRepo(items, 1),
        createStubVotingPowersRepo(),
      );

      const result = await service.getHistoricalVotingPowers(
        0,
        10,
        "desc",
        "timestamp",
      );

      expect(result.items).toEqual(items);
      expect(result.totalCount).toBe(1);
    });

    it("totalCount comes from getHistoricalVotingPowerCount, not items.length", async () => {
      const service = new VotingPowerService(
        createStubHistoricalRepo([], 55),
        createStubVotingPowersRepo(),
      );

      const result = await service.getHistoricalVotingPowers(
        0,
        10,
        "desc",
        "timestamp",
      );

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(55);
    });
  });

  describe("getVotingPowerVariations - without addresses", () => {
    it("returns raw variations from repo when no addresses provided", async () => {
      const variations = [makeDBVotingPowerVariation(addr1)];
      const service = new VotingPowerService(
        createStubHistoricalRepo(),
        createStubVotingPowersRepo(variations),
      );

      const result = await service.getVotingPowerVariations(
        undefined,
        undefined,
        0,
        10,
        "desc",
      );

      expect(result).toEqual(variations);
    });
  });

  describe("getVotingPowerVariations - with addresses", () => {
    it("fills in missing addresses with zero variations", async () => {
      const addr1Variation = makeDBVotingPowerVariation(addr1);
      const service = new VotingPowerService(
        createStubHistoricalRepo(),
        createStubVotingPowersRepo([addr1Variation]),
      );

      const result = await service.getVotingPowerVariations(
        undefined,
        undefined,
        0,
        10,
        "desc",
        [addr1, addr2],
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(addr1Variation);
      expect(result[1]).toEqual({
        accountId: addr2,
        previousVotingPower: 0n,
        currentVotingPower: 0n,
        absoluteChange: 0n,
        percentageChange: "0",
      });
    });

    it("returns matched variation when address has data in repo", async () => {
      const addr1Variation = makeDBVotingPowerVariation(addr1, {
        previousVotingPower: 500n,
        currentVotingPower: 600n,
        absoluteChange: 100n,
        percentageChange: "20",
      });
      const service = new VotingPowerService(
        createStubHistoricalRepo(),
        createStubVotingPowersRepo([addr1Variation]),
      );

      const result = await service.getVotingPowerVariations(
        undefined,
        undefined,
        0,
        10,
        "desc",
        [addr1],
      );

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(addr1Variation);
    });

    it("returns all zero variations when none of the addresses have data", async () => {
      const service = new VotingPowerService(
        createStubHistoricalRepo(),
        createStubVotingPowersRepo([]),
      );

      const result = await service.getVotingPowerVariations(
        undefined,
        undefined,
        0,
        10,
        "desc",
        [addr1, addr2],
      );

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        accountId: addr1,
        previousVotingPower: 0n,
        currentVotingPower: 0n,
        absoluteChange: 0n,
        percentageChange: "0",
      });
      expect(result[1]).toEqual({
        accountId: addr2,
        previousVotingPower: 0n,
        currentVotingPower: 0n,
        absoluteChange: 0n,
        percentageChange: "0",
      });
    });
  });

  describe("getVotingPowerVariationsByAccountId", () => {
    it("returns the variation for the given account", async () => {
      const variation = makeDBVotingPowerVariation(addr1);
      const service = new VotingPowerService(
        createStubHistoricalRepo(),
        createStubVotingPowersRepo([], variation),
      );

      const result = await service.getVotingPowerVariationsByAccountId(
        addr1,
        1700000000,
        1700086400,
      );

      expect(result).toEqual(variation);
    });
  });

  describe("getVotingPowers", () => {
    it("returns result from repository", async () => {
      const repoResult = { items: [], totalCount: 0 };
      const service = new VotingPowerService(
        createStubHistoricalRepo(),
        createStubVotingPowersRepo([], null, repoResult),
      );

      const result = await service.getVotingPowers(
        0,
        10,
        "desc",
        "votingPower",
        { minAmount: undefined, maxAmount: undefined } as AmountFilter,
        [],
      );

      expect(result).toEqual(repoResult);
    });
  });

  describe("getVotingPowersByAccountId", () => {
    it("returns the voting power for the given account", async () => {
      const repoResult: DBAccountPowerWithVariation = {
        id: "test-id",
        accountId: addr1,
        daoId: "UNI",
        votingPower: 1000n,
        delegationsCount: 5,
        votesCount: 3,
        proposalsCount: 2,
        lastVoteTimestamp: 1700000000n,
        absoluteChange: 0n,
        percentageChange: "0",
      };
      const service = new VotingPowerService(
        createStubHistoricalRepo(),
        createStubVotingPowersRepo(
          [],
          null,
          { items: [], totalCount: 0 },
          repoResult,
        ),
      );

      const result = await service.getVotingPowersByAccountId(
        addr1,
        1000,
        2000,
      );

      expect(result).toEqual(repoResult);
    });
  });
});
