import { describe, it, expect, beforeEach, vi } from "vitest";

import { DBOffchainVote, OffchainVotesRequest } from "@/mappers";

import { OffchainVotesService } from "./offchainVotes";

type VoteWithTitle = DBOffchainVote & { proposalTitle: string | null };

const createMockVote = (
  overrides: Partial<VoteWithTitle> = {},
): VoteWithTitle => ({
  spaceId: "ens.eth",
  voter: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  proposalId: "proposal-1",
  choice: { "1": 1 },
  vp: "100",
  reason: "",
  created: 1700000000,
  proposalTitle: "Test Proposal",
  ...overrides,
});

const defaultParams = (
  overrides: Partial<OffchainVotesRequest> = {},
): OffchainVotesRequest => ({
  skip: 0,
  limit: 10,
  orderBy: "timestamp",
  orderDirection: "desc",
  ...overrides,
});

describe("OffchainVotesService", () => {
  let stubRepository: {
    getVotes: ReturnType<typeof vi.fn>;
    getVotesByProposalId: ReturnType<typeof vi.fn>;
  };
  let service: OffchainVotesService;

  beforeEach(() => {
    stubRepository = {
      getVotes: vi.fn().mockResolvedValue({ items: [], totalCount: 0 }),
      getVotesByProposalId: vi
        .fn()
        .mockResolvedValue({ items: [], totalCount: 0 }),
    };
    service = new OffchainVotesService(stubRepository);
  });

  describe("getVotes", () => {
    it("should return items and totalCount from repo", async () => {
      const vote = createMockVote();
      stubRepository.getVotes.mockResolvedValue({
        items: [vote],
        totalCount: 1,
      });

      const result = await service.getVotes(defaultParams());

      expect(result).toEqual({ items: [vote], totalCount: 1 });
    });

    it("should return empty items and 0 count when repo returns empty", async () => {
      const result = await service.getVotes(defaultParams());

      expect(result).toEqual({ items: [], totalCount: 0 });
    });
  });

  describe("getVotesByProposalId", () => {
    it("should return votes scoped to a proposalId", async () => {
      const vote = createMockVote({ proposalId: "p-123" });
      stubRepository.getVotesByProposalId.mockResolvedValue({
        items: [vote],
        totalCount: 1,
      });

      const result = await service.getVotesByProposalId(
        "p-123",
        defaultParams(),
      );

      expect(result).toEqual({ items: [vote], totalCount: 1 });
    });
  });
});
