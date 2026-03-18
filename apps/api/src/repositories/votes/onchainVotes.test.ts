import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address } from "viem";

import {
  votesOnchain,
  proposalsOnchain,
  accountPower,
  votingPowerHistory,
} from "@/database/schema";
import * as schema from "@/database/schema";

import { VotesRepository } from "./onchainVotes";

type VotesOnchainInsert = typeof votesOnchain.$inferInsert;
type ProposalsOnchainInsert = typeof proposalsOnchain.$inferInsert;
type AccountPowerInsert = typeof accountPower.$inferInsert;
type VotingPowerHistoryInsert = typeof votingPowerHistory.$inferInsert;

const VOTER_A: Address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const VOTER_B: Address = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const VOTER_C: Address = "0xcccccccccccccccccccccccccccccccccccccccc";
const PROPOSER: Address = "0xdddddddddddddddddddddddddddddddddddddddd";
const TEST_DAO = "test-dao";

let txCounter = 0;

const createProposal = (
  overrides: Partial<ProposalsOnchainInsert> = {},
): ProposalsOnchainInsert => ({
  id: `proposal-${txCounter++}`,
  txHash: `0x${txCounter.toString(16).padStart(64, "0")}`,
  daoId: TEST_DAO,
  proposerAccountId: PROPOSER,
  targets: [],
  values: [],
  signatures: [],
  calldatas: [],
  startBlock: 100,
  endBlock: 200,
  title: "Test Proposal",
  description: "Test description",
  timestamp: 1700000000n,
  endTimestamp: 1700100000n,
  status: "active",
  ...overrides,
});

const createVote = (
  overrides: Partial<VotesOnchainInsert> = {},
): VotesOnchainInsert => ({
  txHash: `0x${(txCounter++).toString(16).padStart(64, "0")}`,
  daoId: TEST_DAO,
  voterAccountId: VOTER_A,
  proposalId: "proposal-1",
  support: "1",
  votingPower: 1000n,
  reason: null,
  timestamp: 1700000000n,
  ...overrides,
});

const createAccountPowerRow = (
  overrides: Partial<AccountPowerInsert> = {},
): AccountPowerInsert => ({
  accountId: VOTER_A,
  daoId: TEST_DAO,
  votingPower: 1000n,
  votesCount: 0,
  proposalsCount: 0,
  delegationsCount: 0,
  lastVoteTimestamp: 0n,
  ...overrides,
});

const createHistoryRow = (
  overrides: Partial<VotingPowerHistoryInsert> = {},
): VotingPowerHistoryInsert => ({
  transactionHash: `0x${(txCounter++).toString(16).padStart(64, "0")}`,
  daoId: TEST_DAO,
  accountId: VOTER_A,
  votingPower: 1000n,
  delta: 200n,
  deltaMod: 200n,
  timestamp: 1700000000n,
  logIndex: 0,
  ...overrides,
});

describe("VotesRepository", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: VotesRepository;

  beforeAll(async () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new VotesRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(votesOnchain);
    await db.delete(proposalsOnchain);
    await db.delete(accountPower);
    await db.delete(votingPowerHistory);
    txCounter = 0;
  });

  describe("getVotes", () => {
    it("should return items and totalCount", async () => {
      const proposal = createProposal({ id: "proposal-1" });
      await db.insert(proposalsOnchain).values(proposal);
      await db.insert(votesOnchain).values([
        createVote({
          voterAccountId: VOTER_A,
          proposalId: "proposal-1",
          timestamp: 1000n,
        }),
        createVote({
          voterAccountId: VOTER_B,
          proposalId: "proposal-1",
          timestamp: 2000n,
        }),
      ]);

      const result = await repository.getVotes({
        skip: 0,
        limit: 10,
        orderBy: "timestamp",
        orderDirection: "desc",
      });

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });

    it("should include proposalTitle from relation", async () => {
      const proposal = createProposal({
        id: "proposal-1",
        title: "My Proposal",
      });
      await db.insert(proposalsOnchain).values(proposal);
      await db
        .insert(votesOnchain)
        .values(
          createVote({ voterAccountId: VOTER_A, proposalId: "proposal-1" }),
        );

      const result = await repository.getVotes({
        skip: 0,
        limit: 10,
        orderBy: "timestamp",
        orderDirection: "desc",
      });

      expect(result.items[0]!.proposalTitle).toBe("My Proposal");
    });

    it("should filter by date range", async () => {
      const proposal = createProposal({ id: "proposal-1" });
      await db.insert(proposalsOnchain).values(proposal);
      await db.insert(votesOnchain).values([
        createVote({
          voterAccountId: VOTER_A,
          proposalId: "proposal-1",
          timestamp: 1000n,
        }),
        createVote({
          voterAccountId: VOTER_B,
          proposalId: "proposal-1",
          timestamp: 3000n,
        }),
      ]);

      const result = await repository.getVotes({
        skip: 0,
        limit: 10,
        orderBy: "timestamp",
        orderDirection: "desc",
        fromDate: 2000,
        toDate: 4000,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.timestamp).toBe(3000n);
    });

    it("should apply pagination", async () => {
      const proposal = createProposal({ id: "proposal-1" });
      await db.insert(proposalsOnchain).values(proposal);
      await db.insert(votesOnchain).values([
        createVote({
          voterAccountId: VOTER_A,
          proposalId: "proposal-1",
          timestamp: 3000n,
        }),
        createVote({
          voterAccountId: VOTER_B,
          proposalId: "proposal-1",
          timestamp: 2000n,
        }),
      ]);

      const result = await repository.getVotes({
        skip: 1,
        limit: 1,
        orderBy: "timestamp",
        orderDirection: "desc",
      });

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(2);
    });

    it("should return empty when no votes exist", async () => {
      const result = await repository.getVotes({
        skip: 0,
        limit: 10,
        orderBy: "timestamp",
        orderDirection: "desc",
      });

      expect(result).toEqual({ items: [], totalCount: 0 });
    });
  });

  describe("getProposalNonVoters", () => {
    it("should return accounts with VP > 0 that did not vote", async () => {
      const proposal = createProposal({ id: "proposal-1" });
      await db.insert(proposalsOnchain).values(proposal);
      await db
        .insert(accountPower)
        .values([
          createAccountPowerRow({ accountId: VOTER_A, votingPower: 1000n }),
          createAccountPowerRow({ accountId: VOTER_B, votingPower: 500n }),
        ]);
      await db
        .insert(votesOnchain)
        .values(
          createVote({ voterAccountId: VOTER_A, proposalId: "proposal-1" }),
        );

      const result = await repository.getProposalNonVoters(
        "proposal-1",
        0,
        10,
        "desc",
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.voter).toBe(VOTER_B);
      expect(result[0]!.votingPower).toBe(500n);
    });

    it("should exclude accounts with zero voting power", async () => {
      await db
        .insert(accountPower)
        .values([
          createAccountPowerRow({ accountId: VOTER_A, votingPower: 0n }),
          createAccountPowerRow({ accountId: VOTER_B, votingPower: 500n }),
        ]);

      const result = await repository.getProposalNonVoters(
        "proposal-1",
        0,
        10,
        "desc",
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.voter).toBe(VOTER_B);
    });

    it("should filter by addresses", async () => {
      await db
        .insert(accountPower)
        .values([
          createAccountPowerRow({ accountId: VOTER_A, votingPower: 1000n }),
          createAccountPowerRow({ accountId: VOTER_B, votingPower: 500n }),
        ]);

      const result = await repository.getProposalNonVoters(
        "proposal-1",
        0,
        10,
        "desc",
        [VOTER_A],
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.voter).toBe(VOTER_A);
    });

    it("should order by voting power", async () => {
      await db
        .insert(accountPower)
        .values([
          createAccountPowerRow({ accountId: VOTER_A, votingPower: 500n }),
          createAccountPowerRow({ accountId: VOTER_B, votingPower: 1000n }),
        ]);

      const result = await repository.getProposalNonVoters(
        "proposal-1",
        0,
        10,
        "desc",
      );

      expect(result[0]!.votingPower).toBe(1000n);
      expect(result[1]!.votingPower).toBe(500n);
    });

    it("should apply pagination", async () => {
      await db
        .insert(accountPower)
        .values([
          createAccountPowerRow({ accountId: VOTER_A, votingPower: 1000n }),
          createAccountPowerRow({ accountId: VOTER_B, votingPower: 500n }),
        ]);

      const result = await repository.getProposalNonVoters(
        "proposal-1",
        1,
        1,
        "desc",
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.votingPower).toBe(500n);
    });
  });

  describe("getProposalNonVotersCount", () => {
    it("should return count of non-voters with VP > 0", async () => {
      const proposal = createProposal({ id: "proposal-1" });
      await db.insert(proposalsOnchain).values(proposal);
      await db
        .insert(accountPower)
        .values([
          createAccountPowerRow({ accountId: VOTER_A, votingPower: 1000n }),
          createAccountPowerRow({ accountId: VOTER_B, votingPower: 500n }),
          createAccountPowerRow({ accountId: VOTER_C, votingPower: 0n }),
        ]);
      await db
        .insert(votesOnchain)
        .values(
          createVote({ voterAccountId: VOTER_A, proposalId: "proposal-1" }),
        );

      const count = await repository.getProposalNonVotersCount("proposal-1");

      expect(count).toBe(1);
    });

    it("should return 0 when everyone voted", async () => {
      const proposal = createProposal({ id: "proposal-1" });
      await db.insert(proposalsOnchain).values(proposal);
      await db
        .insert(accountPower)
        .values(
          createAccountPowerRow({ accountId: VOTER_A, votingPower: 1000n }),
        );
      await db
        .insert(votesOnchain)
        .values(
          createVote({ voterAccountId: VOTER_A, proposalId: "proposal-1" }),
        );

      const count = await repository.getProposalNonVotersCount("proposal-1");

      expect(count).toBe(0);
    });
  });

  describe("getLastVotersTimestamp", () => {
    it("should return last vote timestamp per voter", async () => {
      const proposal1 = createProposal({ id: "proposal-1" });
      const proposal2 = createProposal({ id: "proposal-2" });
      await db.insert(proposalsOnchain).values([proposal1, proposal2]);
      await db.insert(votesOnchain).values([
        createVote({
          voterAccountId: VOTER_A,
          proposalId: "proposal-1",
          timestamp: 1000n,
        }),
        createVote({
          voterAccountId: VOTER_A,
          proposalId: "proposal-2",
          timestamp: 3000n,
        }),
      ]);

      const result = await repository.getLastVotersTimestamp([VOTER_A]);

      expect(result[VOTER_A]).toBe(3000n);
    });

    it("should return timestamps for multiple voters", async () => {
      const proposal1 = createProposal({ id: "proposal-1" });
      const proposal2 = createProposal({ id: "proposal-2" });
      await db.insert(proposalsOnchain).values([proposal1, proposal2]);
      await db.insert(votesOnchain).values([
        createVote({
          voterAccountId: VOTER_A,
          proposalId: "proposal-1",
          timestamp: 1000n,
        }),
        createVote({
          voterAccountId: VOTER_B,
          proposalId: "proposal-2",
          timestamp: 2000n,
        }),
      ]);

      const result = await repository.getLastVotersTimestamp([
        VOTER_A,
        VOTER_B,
      ]);

      expect(result[VOTER_A]).toBe(1000n);
      expect(result[VOTER_B]).toBe(2000n);
    });
  });

  describe("getVotingPowerVariation", () => {
    it("should return current - old voting power", async () => {
      await db.insert(votingPowerHistory).values([
        createHistoryRow({
          accountId: VOTER_A,
          votingPower: 500n,
          timestamp: 1000n,
          logIndex: 0,
        }),
        createHistoryRow({
          accountId: VOTER_A,
          votingPower: 1000n,
          timestamp: 3000n,
          logIndex: 1,
        }),
      ]);

      const result = await repository.getVotingPowerVariation([VOTER_A], 2000);

      expect(result[VOTER_A]).toBe(500n);
    });

    it("should handle no old power (full current is the variation)", async () => {
      await db.insert(votingPowerHistory).values(
        createHistoryRow({
          accountId: VOTER_A,
          votingPower: 1000n,
          timestamp: 3000n,
          logIndex: 0,
        }),
      );

      const result = await repository.getVotingPowerVariation([VOTER_A], 1000);

      expect(result[VOTER_A]).toBe(1000n);
    });
  });

  describe("getVotesByProposalId", () => {
    it("should return votes for a specific proposal", async () => {
      const proposal = createProposal({ id: "proposal-1", title: "Test Prop" });
      await db.insert(proposalsOnchain).values(proposal);
      await db
        .insert(votesOnchain)
        .values([
          createVote({ voterAccountId: VOTER_A, proposalId: "proposal-1" }),
          createVote({ voterAccountId: VOTER_B, proposalId: "proposal-1" }),
        ]);

      const result = await repository.getVotesByProposalId(
        "proposal-1",
        0,
        10,
        "timestamp",
        "desc",
      );

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
      expect(result.items[0]!.proposalTitle).toBe("Test Prop");
    });

    it("should filter by support", async () => {
      const proposal = createProposal({ id: "proposal-1" });
      await db.insert(proposalsOnchain).values(proposal);
      await db.insert(votesOnchain).values([
        createVote({
          voterAccountId: VOTER_A,
          proposalId: "proposal-1",
          support: "1",
        }),
        createVote({
          voterAccountId: VOTER_B,
          proposalId: "proposal-1",
          support: "0",
        }),
      ]);

      const result = await repository.getVotesByProposalId(
        "proposal-1",
        0,
        10,
        "timestamp",
        "desc",
        undefined,
        "1",
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.support).toBe("1");
    });

    it("should filter by voter addresses", async () => {
      const proposal = createProposal({ id: "proposal-1" });
      await db.insert(proposalsOnchain).values(proposal);
      await db
        .insert(votesOnchain)
        .values([
          createVote({ voterAccountId: VOTER_A, proposalId: "proposal-1" }),
          createVote({ voterAccountId: VOTER_B, proposalId: "proposal-1" }),
        ]);

      const result = await repository.getVotesByProposalId(
        "proposal-1",
        0,
        10,
        "timestamp",
        "desc",
        [VOTER_A],
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.voterAccountId).toBe(VOTER_A);
    });

    it("should filter by date range", async () => {
      const proposal = createProposal({ id: "proposal-1" });
      await db.insert(proposalsOnchain).values(proposal);
      await db.insert(votesOnchain).values([
        createVote({
          voterAccountId: VOTER_A,
          proposalId: "proposal-1",
          timestamp: 1000n,
        }),
        createVote({
          voterAccountId: VOTER_B,
          proposalId: "proposal-1",
          timestamp: 3000n,
        }),
      ]);

      const result = await repository.getVotesByProposalId(
        "proposal-1",
        0,
        10,
        "timestamp",
        "desc",
        undefined,
        undefined,
        2000,
        4000,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.timestamp).toBe(3000n);
    });

    it("should order by votingPower", async () => {
      const proposal = createProposal({ id: "proposal-1" });
      await db.insert(proposalsOnchain).values(proposal);
      await db.insert(votesOnchain).values([
        createVote({
          voterAccountId: VOTER_A,
          proposalId: "proposal-1",
          votingPower: 500n,
        }),
        createVote({
          voterAccountId: VOTER_B,
          proposalId: "proposal-1",
          votingPower: 1000n,
        }),
      ]);

      const result = await repository.getVotesByProposalId(
        "proposal-1",
        0,
        10,
        "votingPower",
        "desc",
      );

      expect(result.items[0]!.votingPower).toBe(1000n);
      expect(result.items[1]!.votingPower).toBe(500n);
    });

    it("should apply pagination", async () => {
      const proposal = createProposal({ id: "proposal-1" });
      await db.insert(proposalsOnchain).values(proposal);
      await db.insert(votesOnchain).values([
        createVote({
          voterAccountId: VOTER_A,
          proposalId: "proposal-1",
          timestamp: 3000n,
        }),
        createVote({
          voterAccountId: VOTER_B,
          proposalId: "proposal-1",
          timestamp: 2000n,
        }),
      ]);

      const result = await repository.getVotesByProposalId(
        "proposal-1",
        1,
        1,
        "timestamp",
        "desc",
      );

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(2);
    });

    it("should return empty for non-existent proposal", async () => {
      const result = await repository.getVotesByProposalId(
        "non-existent",
        0,
        10,
        "timestamp",
        "desc",
      );

      expect(result).toEqual({ items: [], totalCount: 0 });
    });
  });
});
