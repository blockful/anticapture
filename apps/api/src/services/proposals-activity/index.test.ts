import { Address } from "viem";
import { describe, it, expect, beforeEach } from "vitest";
import { DaoIdEnum } from "@/lib/enums";
import { DbProposal, DbVote, DbProposalWithVote } from "@/repositories/";
import { ProposalsActivityService, ProposalActivityRequest } from "./index";

const VOTER_ADDRESS = "0x1111111111111111111111111111111111111111" as Address;

function createStubRepo() {
  const stub = {
    lastActivityStart: null as number | null,
    firstVoteTs: null as number | null,
    proposals: [] as DbProposal[],
    votes: [] as DbVote[],
    paginationResult: { proposals: [] as DbProposalWithVote[], totalCount: 0 },

    getFirstVoteTimestamp: async () => stub.firstVoteTs,
    getProposals: async () => stub.proposals,
    getUserVotes: async () => stub.votes,
    getProposalsWithVotesAndPagination: async (
      _addr: Address,
      activityStart: number,
    ) => {
      stub.lastActivityStart = activityStart;
      return stub.paginationResult;
    },
  };
  return stub;
}

function createStubDaoClient() {
  return {
    getVotingPeriod: async () => 40320n,
    getVotingDelay: async () => 2n,
    getCurrentBlockNumber: async () => 1000000,
    getBlockTime: async () => 1700000000,
    getProposalStatus: async () => "EXECUTED",
  };
}

const createDbProposal = (overrides = {}): DbProposal => ({
  id: "proposal-1",
  dao_id: "UNI",
  proposer_account_id: VOTER_ADDRESS,
  title: "Test proposal",
  description: "Test proposal",
  start_block: 100,
  end_block: 200,
  timestamp: "1699900000",
  status: "EXECUTED",
  for_votes: 1000n,
  against_votes: 100n,
  abstain_votes: 50n,
  proposal_end_timestamp: "1700100000",
  ...overrides,
});

const createDbVote = (overrides = {}): DbVote => ({
  id: "vote-1",
  voter_account_id: VOTER_ADDRESS,
  proposal_id: "proposal-1",
  support: "1",
  voting_power: "1000",
  reason: "",
  timestamp: "1699950000",
  ...overrides,
});

const createProposalWithVote = (overrides = {}): DbProposalWithVote => ({
  proposal: createDbProposal(),
  userVote: createDbVote(),
  ...overrides,
});

const defaultRequest: ProposalActivityRequest = {
  address: VOTER_ADDRESS,
  daoId: DaoIdEnum.UNI,
  blockTime: 12,
  skip: 0,
  limit: 10,
  orderBy: "timestamp",
  orderDirection: "desc",
};

describe("ProposalsActivityService", () => {
  let repo: ReturnType<typeof createStubRepo>;
  let service: ProposalsActivityService;

  beforeEach(() => {
    repo = createStubRepo();
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    service = new ProposalsActivityService(repo, createStubDaoClient() as any);
  });

  describe("getProposalsActivity", () => {
    it("should return empty activity when user has never voted", async () => {
      const result = await service.getProposalsActivity(defaultRequest);

      expect(result.neverVoted).toBe(true);
      expect(result.totalProposals).toBe(0);
      expect(result.votedProposals).toBe(0);
      expect(result.proposals).toHaveLength(0);
      expect(result.address).toBe(VOTER_ADDRESS);
    });

    it("should return proposals with user votes and analytics", async () => {
      repo.firstVoteTs = 1699000000;
      repo.paginationResult = {
        proposals: [createProposalWithVote()],
        totalCount: 1,
      };
      repo.proposals = [createDbProposal()];
      repo.votes = [createDbVote()];

      const result = await service.getProposalsActivity(defaultRequest);

      expect(result.neverVoted).toBe(false);
      expect(result.totalProposals).toBe(1);
      expect(result.proposals).toHaveLength(1);
      expect(result.proposals[0]?.userVote).not.toBeNull();
    });

    it("should calculate yesRate correctly", async () => {
      repo.firstVoteTs = 1699000000;
      repo.paginationResult = {
        proposals: [createProposalWithVote()],
        totalCount: 1,
      };
      repo.proposals = [createDbProposal()];
      repo.votes = [createDbVote({ support: "1" })];

      const result = await service.getProposalsActivity(defaultRequest);

      expect(result.yesRate).toBe(100);
    });
  });
});
