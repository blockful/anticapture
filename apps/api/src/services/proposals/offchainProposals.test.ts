import { describe, it, expect, beforeEach, vi } from "vitest";

import { DBOffchainProposal } from "@/mappers";

import { OffchainProposalsService } from "./offchainProposals";

const createMockProposal = (
  overrides: Partial<DBOffchainProposal> = {},
): DBOffchainProposal => ({
  id: "proposal-1",
  spaceId: "ens.eth",
  author: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
  title: "Test Proposal",
  body: "Test body",
  discussion: "",
  type: "single-choice",
  start: 1700000000,
  end: 1700086400,
  state: "active",
  created: 1700000000,
  updated: 1700000000,
  link: "",
  flagged: false,
  ...overrides,
});

describe("OffchainProposalsService", () => {
  let stubRepository: {
    getProposals: ReturnType<typeof vi.fn>;
    getProposalsCount: ReturnType<typeof vi.fn>;
    getProposalById: ReturnType<typeof vi.fn>;
  };
  let service: OffchainProposalsService;

  beforeEach(() => {
    stubRepository = {
      getProposals: vi.fn().mockResolvedValue([]),
      getProposalsCount: vi.fn().mockResolvedValue(0),
      getProposalById: vi.fn().mockResolvedValue(undefined),
    };
    service = new OffchainProposalsService(stubRepository);
  });

  describe("getProposals", () => {
    it("should return items and totalCount from parallel repo calls", async () => {
      const proposal = createMockProposal();
      stubRepository.getProposals.mockResolvedValue([proposal]);
      stubRepository.getProposalsCount.mockResolvedValue(1);

      const result = await service.getProposals({});

      expect(result).toEqual({ items: [proposal], totalCount: 1 });
    });

    it("should return empty items and 0 count when repo returns empty", async () => {
      const result = await service.getProposals({});

      expect(result).toEqual({ items: [], totalCount: 0 });
    });
  });

  describe("getProposalById", () => {
    it("should return proposal from repo", async () => {
      const proposal = createMockProposal({ id: "find-me" });
      stubRepository.getProposalById.mockResolvedValue(proposal);

      const result = await service.getProposalById("find-me");

      expect(result).toEqual(proposal);
    });

    it("should return undefined when not found", async () => {
      const result = await service.getProposalById("nonexistent");

      expect(result).toBeUndefined();
    });
  });
});
