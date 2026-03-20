import { describe, it, expect, beforeEach } from "vitest";
import { ProposalStatus } from "@/lib/constants";
import { DBProposal, ProposalsRequest } from "@/mappers";
import { DAOClient } from "@/clients";
import { ProposalsService } from "./onchainProposals";

const DEFAULT_REQ: ProposalsRequest = {
  skip: 0,
  limit: 10,
  includeOptimisticProposals: true,
};

const createMockProposal = (
  overrides: Partial<DBProposal> = {},
): DBProposal => ({
  id: "1",
  daoId: "UNI",
  txHash: "0xabc",
  proposerAccountId: "0x0000000000000000000000000000000000000001",
  targets: [],
  values: [],
  signatures: [],
  calldatas: [],
  title: "Test Proposal",
  description: "A proposal",
  startBlock: 100,
  endBlock: 200,
  timestamp: 1700000000n,
  endTimestamp: 1700001000n,
  status: ProposalStatus.PENDING,
  forVotes: 1000n,
  againstVotes: 0n,
  abstainVotes: 0n,
  proposalType: 0,
  ...overrides,
});

function createStubRepo() {
  const stub: {
    proposals: DBProposal[];
    count: number;
    byId: DBProposal | undefined;
    lastGetProposalsArgs: unknown[] | undefined;
    getProposals: (...args: unknown[]) => Promise<DBProposal[]>;
    getProposalsCount: () => Promise<number>;
    getProposalById: () => Promise<DBProposal | undefined>;
  } = {
    proposals: [],
    count: 0,
    byId: undefined,
    lastGetProposalsArgs: undefined,
    getProposals: async (...args: unknown[]) => {
      stub.lastGetProposalsArgs = args;
      return stub.proposals;
    },
    getProposalsCount: async () => stub.count,
    getProposalById: async () => stub.byId,
  };
  return stub;
}

function createStubDaoClient() {
  const stub: {
    currentBlock: number;
    blockTime: number | null;
    proposalStatus: string;
    proposalStatusQueue: string[] | undefined;
    getCurrentBlockNumberCallCount: number;
  } & DAOClient = {
    currentBlock: 300,
    blockTime: 1700001000,
    proposalStatus: ProposalStatus.ACTIVE,
    proposalStatusQueue: undefined,
    getCurrentBlockNumberCallCount: 0,
    getDaoId: () => "UNI",
    getVotingDelay: async () => 0n,
    getVotingPeriod: async () => 0n,
    getTimelockDelay: async () => 0n,
    getQuorum: async (_proposalId) => 0n,
    getProposalThreshold: async () => 0n,
    alreadySupportCalldataReview: () => false,
    calculateQuorum: () => 0n,
    getCurrentBlockNumber: async () => {
      stub.getCurrentBlockNumberCallCount++;
      return stub.currentBlock;
    },
    getBlockTime: async (_blockNumber) => stub.blockTime,
    getProposalStatus: async (_proposal, _currentBlock, _currentTimestamp) =>
      stub.proposalStatusQueue?.shift() ?? stub.proposalStatus,
  };
  return stub;
}

describe("ProposalsService", () => {
  let service: ProposalsService;
  let repo: ReturnType<typeof createStubRepo>;
  let daoClient: ReturnType<typeof createStubDaoClient>;

  beforeEach(() => {
    repo = createStubRepo();
    daoClient = createStubDaoClient();
    service = new ProposalsService(repo, daoClient);
  });

  describe("getProposalsCount", () => {
    it("should return count from repo", async () => {
      repo.count = 42;

      const result = await service.getProposalsCount();

      expect(result).toBe(42);
    });
  });

  describe("getProposals", () => {
    it("should return proposals with on-chain status", async () => {
      repo.proposals = [createMockProposal()];
      daoClient.proposalStatus = ProposalStatus.ACTIVE;

      const result = await service.getProposals({ ...DEFAULT_REQ });

      expect(result).toHaveLength(1);
      expect(result[0]?.status).toBe(ProposalStatus.ACTIVE);
    });

    it("should map ACTIVE to PENDING and ACTIVE for DB query", async () => {
      await service.getProposals({
        ...DEFAULT_REQ,
        status: [ProposalStatus.ACTIVE],
      });

      expect(repo.lastGetProposalsArgs?.[3]).toEqual([
        ProposalStatus.PENDING,
        ProposalStatus.ACTIVE,
      ]);
    });

    it("should map DEFEATED and SUCCEEDED to PENDING and ACTIVE for DB query", async () => {
      await service.getProposals({
        ...DEFAULT_REQ,
        status: [ProposalStatus.DEFEATED, ProposalStatus.SUCCEEDED],
      });

      // Both map to [PENDING, ACTIVE], which gets deduplicated
      expect(repo.lastGetProposalsArgs?.[3]).toEqual([
        ProposalStatus.PENDING,
        ProposalStatus.ACTIVE,
      ]);
    });

    it("should filter by original status after chain check", async () => {
      repo.proposals = [
        createMockProposal({ id: "1" }),
        createMockProposal({ id: "2" }),
      ];
      daoClient.proposalStatusQueue = [
        ProposalStatus.ACTIVE,
        ProposalStatus.DEFEATED,
      ];

      const result = await service.getProposals({
        ...DEFAULT_REQ,
        status: [ProposalStatus.ACTIVE],
      });

      // Only proposal1 has ACTIVE status after chain check
      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("1");
    });

    it("should not filter when no status provided", async () => {
      repo.proposals = [createMockProposal()];
      daoClient.proposalStatus = ProposalStatus.ACTIVE;

      const result = await service.getProposals({ ...DEFAULT_REQ });

      expect(result).toHaveLength(1);
    });

    it("should exclude optimistic proposals when configured", async () => {
      const serviceWithOptimistic = new ProposalsService(repo, daoClient, 2);

      await serviceWithOptimistic.getProposals({
        ...DEFAULT_REQ,
        includeOptimisticProposals: false,
      });

      expect(repo.lastGetProposalsArgs?.[6]).toEqual([2]);
    });

    it("should not exclude when includeOptimisticProposals is true", async () => {
      const serviceWithOptimistic = new ProposalsService(repo, daoClient, 2);

      await serviceWithOptimistic.getProposals({
        ...DEFAULT_REQ,
        includeOptimisticProposals: true,
      });

      expect(repo.lastGetProposalsArgs?.[6]).toBeUndefined();
    });

    it("should deduplicate PENDING + ACTIVE in status array", async () => {
      await service.getProposals({
        ...DEFAULT_REQ,
        status: [ProposalStatus.PENDING, ProposalStatus.ACTIVE],
      });

      // PENDING stays as [PENDING], ACTIVE maps to [PENDING, ACTIVE], deduplication gives [PENDING, ACTIVE]
      expect(repo.lastGetProposalsArgs?.[3]).toEqual([
        ProposalStatus.PENDING,
        ProposalStatus.ACTIVE,
      ]);
    });
  });

  describe("getProposalById", () => {
    it("should return proposal with on-chain status", async () => {
      repo.byId = createMockProposal();
      daoClient.proposalStatus = ProposalStatus.ACTIVE;

      const result = await service.getProposalById("1");

      expect(result?.status).toBe(ProposalStatus.ACTIVE);
    });

    it("should return undefined when not found", async () => {
      const result = await service.getProposalById("999");

      expect(result).toBeUndefined();
      expect(daoClient.getCurrentBlockNumberCallCount).toBe(0);
    });
  });
});
