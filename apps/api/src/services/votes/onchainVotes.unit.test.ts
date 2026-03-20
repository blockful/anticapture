import { Address, getAddress } from "viem";
import { describe, it, expect, beforeEach } from "vitest";
import { DBVote } from "@/mappers";
import { VotesService } from "./onchainVotes";

const VOTER_A = getAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
const VOTER_B = getAddress("0x1234567890123456789012345678901234567890");
const TX_HASH =
  "0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890";

type VoteWithTitle = DBVote & {
  proposalTitle: string | null;
  transactionHash: string;
  voterAddress: Address;
};

const createMockDBVote = (
  overrides: Partial<VoteWithTitle> = {},
): VoteWithTitle => ({
  voterAccountId: VOTER_A,
  txHash: TX_HASH,
  transactionHash: TX_HASH,
  voterAddress: VOTER_A,
  daoId: "UNI",
  proposalId: "1",
  support: "1",
  votingPower: 1000n,
  reason: null,
  timestamp: 1700000000n,
  proposalTitle: "Test Proposal",
  ...overrides,
});

function createStubRepo() {
  const stub = {
    votes: [] as VoteWithTitle[],
    votesTotalCount: 0,
    nonVoters: [] as { voter: Address; votingPower: bigint }[],
    nonVotersCount: 0,
    lastVotersTimestamp: {} as Record<Address, bigint>,
    votingPowerVariation: {} as Record<Address, bigint>,
    lastVotingPowerVariationTimestamp: undefined as number | undefined,
    nonVotersCountCallCount: 0,
    getVotes: async () => ({ items: stub.votes, totalCount: stub.votesTotalCount }),
    getVotesByProposalId: async () => ({ items: stub.votes, totalCount: stub.votesTotalCount }),
    getProposalNonVoters: async () => stub.nonVoters,
    getProposalNonVotersCount: async () => {
      stub.nonVotersCountCallCount++;
      return stub.nonVotersCount;
    },
    getLastVotersTimestamp: async () => stub.lastVotersTimestamp,
    getVotingPowerVariation: async (_voters: Address[], timestamp: number) => {
      stub.lastVotingPowerVariationTimestamp = timestamp;
      return stub.votingPowerVariation;
    },
  };
  return stub;
}

describe("VotesService", () => {
  let service: VotesService;
  let repo: ReturnType<typeof createStubRepo>;

  beforeEach(() => {
    repo = createStubRepo();
    service = new VotesService(repo);
  });

  const EXPECTED_VOTE = {
    voterAddress: VOTER_A,
    transactionHash: TX_HASH,
    proposalId: "1",
    support: 1,
    votingPower: "1000",
    reason: null,
    timestamp: 1700000000,
    proposalTitle: "Test Proposal",
  };

  describe("getVotes", () => {
    it("should return parsed votes from repo", async () => {
      repo.votes = [createMockDBVote()];
      repo.votesTotalCount = 1;

      const result = await service.getVotes({
        skip: 0,
        limit: 10,
        orderBy: "timestamp",
        orderDirection: "desc",
      });

      expect(result).toEqual({ items: [EXPECTED_VOTE], totalCount: 1 });
    });

    it("should return empty when no votes", async () => {
      const result = await service.getVotes({
        skip: 0,
        limit: 10,
        orderBy: "timestamp",
        orderDirection: "desc",
      });

      expect(result).toEqual({ items: [], totalCount: 0 });
    });
  });

  describe("getVotesByProposal", () => {
    it("should remap txHash to transactionHash and voterAccountId to voterAddress", async () => {
      repo.votes = [createMockDBVote()];
      repo.votesTotalCount = 1;

      const result = await service.getVotesByProposal("1");

      expect(result).toEqual({
        totalCount: 1,
        items: [EXPECTED_VOTE],
      });
    });
  });

  describe("getProposalNonVoters", () => {
    it("should return full non-voters response", async () => {
      repo.nonVoters = [{ voter: VOTER_A, votingPower: 1000n }];
      repo.nonVotersCount = 1;
      repo.lastVotersTimestamp = { [VOTER_A]: 1699000000n };
      repo.votingPowerVariation = { [VOTER_A]: 100n };

      const result = await service.getProposalNonVoters("1", 0, 10, "desc");

      expect(result).toEqual({
        totalCount: 1,
        items: [
          {
            voter: VOTER_A,
            votingPower: "1000",
            lastVoteTimestamp: 1699000000,
            votingPowerVariation: "100",
          },
        ],
      });
    });

    it("should use addresses length as totalCount when addresses filter provided", async () => {
      repo.nonVoters = [{ voter: VOTER_A, votingPower: 500n }];

      const result = await service.getProposalNonVoters("1", 0, 10, "desc", [
        VOTER_A,
        VOTER_B,
      ]);

      expect(result).toEqual({
        totalCount: 2,
        items: [{ voter: VOTER_A, votingPower: "500", lastVoteTimestamp: 0, votingPowerVariation: "0" }],
      });
      // Should NOT call getProposalNonVotersCount
      expect(repo.nonVotersCountCallCount).toBe(0);
    });

    it("should return empty items", async () => {
      const result = await service.getProposalNonVoters("1", 0, 10, "desc");

      expect(result).toEqual({ totalCount: 0, items: [] });
    });

    it("should default lastVoteTimestamp to 0 when missing", async () => {
      repo.nonVoters = [{ voter: VOTER_A, votingPower: 500n }];
      repo.nonVotersCount = 1;
      repo.votingPowerVariation = { [VOTER_A]: 50n };

      const result = await service.getProposalNonVoters("1", 0, 10, "desc");

      expect(result).toEqual({
        totalCount: 1,
        items: [{ voter: VOTER_A, votingPower: "500", lastVoteTimestamp: 0, votingPowerVariation: "50" }],
      });
    });

    it("should default votingPowerVariation to '0' when missing", async () => {
      repo.nonVoters = [{ voter: VOTER_A, votingPower: 500n }];
      repo.nonVotersCount = 1;
      repo.lastVotersTimestamp = { [VOTER_A]: 1699000000n };

      const result = await service.getProposalNonVoters("1", 0, 10, "desc");

      expect(result).toEqual({
        totalCount: 1,
        items: [{ voter: VOTER_A, votingPower: "500", lastVoteTimestamp: 1699000000, votingPowerVariation: "0" }],
      });
    });

    it("should compute comparisonTimestamp from Date.now()", async () => {
      repo.nonVoters = [{ voter: VOTER_A, votingPower: 500n }];
      repo.nonVotersCount = 1;

      // DaysEnum["30d"] = 30 * 86400 = 2592000
      const beforeCall = Math.floor(Date.now() / 1000);
      await service.getProposalNonVoters("1", 0, 10, "desc");
      const afterCall = Math.floor(Date.now() / 1000);

      const expectedMin = beforeCall - 2592000;
      const expectedMax = afterCall - 2592000;

      expect(repo.lastVotingPowerVariationTimestamp).toBeGreaterThanOrEqual(
        expectedMin,
      );
      expect(repo.lastVotingPowerVariationTimestamp).toBeLessThanOrEqual(
        expectedMax,
      );
    });
  });
});
