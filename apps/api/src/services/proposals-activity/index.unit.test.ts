import { Address } from "viem";
import { describe, it, expect, beforeEach } from "vitest";
import { DAOClient } from "@/clients";
import { DaoIdEnum } from "@/lib/enums";
import {
  DbProposal,
  DbVote,
  DbProposalWithVote,
  OrderByField,
  OrderDirection,
  VoteFilter,
} from "@/repositories/";
import {
  ProposalsActivityService,
  ProposalsActivityRepository,
  ProposalActivityRequest,
} from "./index";

const VOTER_ADDRESS = "0x1111111111111111111111111111111111111111" as Address;

function createStubRepo(): ProposalsActivityRepository & {
  lastActivityStart: number | null;
  firstVoteTs: number | null;
  proposals: DbProposal[];
  votes: DbVote[];
  paginationResult: { proposals: DbProposalWithVote[]; totalCount: number };
} {
  const stub = {
    lastActivityStart: null as number | null,
    firstVoteTs: null as number | null,
    proposals: [] as DbProposal[],
    votes: [] as DbVote[],
    paginationResult: { proposals: [] as DbProposalWithVote[], totalCount: 0 },

    getFirstVoteTimestamp: async (_address: Address) => stub.firstVoteTs,
    getProposals: async (
      _daoId: DaoIdEnum,
      _activityStart: number,
      _votingPeriodSeconds: number,
    ) => stub.proposals,
    getUserVotes: async (
      _address: Address,
      _daoId: DaoIdEnum,
      _proposalIds: string[],
    ) => stub.votes,
    getProposalsWithVotesAndPagination: async (
      _addr: Address,
      activityStart: number,
      _votingPeriodSeconds: number,
      _skip: number,
      _limit: number,
      _orderBy: OrderByField,
      _orderDirection: OrderDirection,
      _userVoteFilter?: VoteFilter,
    ) => {
      stub.lastActivityStart = activityStart;
      return stub.paginationResult;
    },
  };
  return stub;
}

function createStubDaoClient(): DAOClient {
  return {
    getDaoId: () => "UNI",
    getVotingPeriod: async () => 40320n,
    getVotingDelay: async () => 2n,
    getTimelockDelay: async () => 0n,
    getQuorum: async (_proposalId) => 0n,
    getProposalThreshold: async () => 0n,
    getCurrentBlockNumber: async () => 1000000,
    getBlockTime: async (_blockNumber) => 1700000000,
    alreadySupportCalldataReview: () => false,
    calculateQuorum: () => 0n,
    getProposalStatus: async (_proposal, _currentBlock, _currentTimestamp) =>
      "EXECUTED",
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
    service = new ProposalsActivityService(repo, createStubDaoClient());
  });

  describe("getProposalsActivity", () => {
    it("should return empty activity when user has never voted", async () => {
      const result = await service.getProposalsActivity(defaultRequest);

      expect(result).toEqual({
        address: VOTER_ADDRESS,
        totalProposals: 0,
        votedProposals: 0,
        neverVoted: true,
        winRate: 0,
        yesRate: 0,
        avgTimeBeforeEnd: 0,
        proposals: [],
      });
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

      // avgTimeBeforeEnd = 1700100000 - 1699950000 = 150000
      expect(result).toEqual({
        address: VOTER_ADDRESS,
        totalProposals: 1,
        votedProposals: 1,
        neverVoted: false,
        winRate: 100,
        yesRate: 100,
        avgTimeBeforeEnd: 150000,
        proposals: [
          {
            proposal: {
              id: "proposal-1",
              daoId: "UNI",
              proposerAccountId: VOTER_ADDRESS,
              title: "Test proposal",
              description: "Test proposal",
              startBlock: 100,
              endBlock: 200,
              timestamp: 1699900000n,
              status: "EXECUTED",
              forVotes: 1000n,
              againstVotes: 100n,
              abstainVotes: 50n,
              endTimestamp: 1700100000n,
            },
            userVote: {
              id: "vote-1",
              voterAccountId: VOTER_ADDRESS,
              proposalId: "proposal-1",
              support: "1",
              votingPower: "1000",
              reason: "",
              timestamp: "1699950000",
            },
          },
        ],
      });
    });
  });
});
