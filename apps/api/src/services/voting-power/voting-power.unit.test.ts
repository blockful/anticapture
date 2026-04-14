import { Address } from "viem";
import { describe, it, expect } from "vitest";
import { DBAccountPower, DBVotingPowerVariation } from "@/mappers";
import { VotingPowerService } from "./voting-power";

function createStubVotingRepo(items: DBAccountPower[] = [], count = 0) {
  return {
    getVotingPowers: async () => ({ items, totalCount: count }),
  };
}

function createStubVariationRepo(variations: DBVotingPowerVariation[] = []) {
  return {
    getVotingPowerChanges: async () => variations,
  };
}

const makeDBAccountPower = (overrides = {}): DBAccountPower => ({
  id: "test-id",
  accountId: "0x1111111111111111111111111111111111111111" as Address,
  daoId: "UNI",
  votingPower: 1000n,
  delegationsCount: 5,
  votesCount: 3,
  proposalsCount: 2,
  lastVoteTimestamp: 1700000000n,
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

const accountId: Address = "0xabcdef1234567890abcdef1234567890abcdef12";

describe("VotingPowerService (voting-power)", () => {
  describe("getVotingPowers", () => {
    it("returns items and totalCount from repository", async () => {
      const items = [makeDBAccountPower()];
      const service = new VotingPowerService(
        createStubVotingRepo(items, 1),
        createStubVariationRepo(),
      );

      const result = await service.getVotingPowers(accountId, 0, 10);

      expect(result.items).toEqual(items);
      expect(result.totalCount).toBe(1);
    });

    it("totalCount comes from repo, not items.length", async () => {
      const service = new VotingPowerService(
        createStubVotingRepo([], 77),
        createStubVariationRepo(),
      );

      const result = await service.getVotingPowers(accountId, 0, 10);

      expect(result.items).toHaveLength(0);
      expect(result.totalCount).toBe(77);
    });
  });

  describe("getVotingPowerVariations", () => {
    it("returns variations from repository", async () => {
      const addr: Address = "0x3333333333333333333333333333333333333333";
      const variations = [makeDBVotingPowerVariation(addr)];
      const svc = new VotingPowerService(
        createStubVotingRepo(),
        createStubVariationRepo(variations),
      );

      const result = await svc.getVotingPowerVariations(
        1700000000,
        0,
        10,
        "desc",
      );

      expect(result).toEqual(variations);
    });

    it("returns empty array when repo returns no variations", async () => {
      const svc = new VotingPowerService(
        createStubVotingRepo(),
        createStubVariationRepo([]),
      );

      const result = await svc.getVotingPowerVariations(
        1700000000,
        0,
        10,
        "desc",
      );

      expect(result).toEqual([]);
    });
  });
});
