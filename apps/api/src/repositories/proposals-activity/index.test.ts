import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { getAddress } from "viem";
import * as schema from "@/database/schema";
import { proposalsOnchain, votesOnchain } from "@/database/schema";
import { DaoIdEnum } from "@/lib/enums";
import { DrizzleProposalsActivityRepository } from "./index";

const VOTER = getAddress("0x1111111111111111111111111111111111111111");
const OTHER_VOTER = getAddress("0x2222222222222222222222222222222222222222");

type VoteInsert = typeof votesOnchain.$inferInsert;
type ProposalInsert = typeof proposalsOnchain.$inferInsert;

const createVote = (overrides: Partial<VoteInsert> = {}): VoteInsert => ({
  txHash: "0xvote1",
  daoId: "UNI",
  voterAccountId: VOTER,
  proposalId: "proposal-1",
  support: "1",
  votingPower: 1000n,
  reason: "",
  timestamp: 1700000000n,
  ...overrides,
});

const createProposal = (
  overrides: Partial<ProposalInsert> = {},
): ProposalInsert => ({
  id: "proposal-1",
  txHash: "0xtx1",
  daoId: "UNI",
  proposerAccountId: VOTER,
  targets: [],
  values: [],
  signatures: [],
  calldatas: [],
  startBlock: 100,
  endBlock: 200,
  description: "Test proposal",
  timestamp: 1699900000n,
  endTimestamp: 1700100000n,
  status: "ACTIVE",
  forVotes: 0n,
  againstVotes: 0n,
  abstainVotes: 0n,
  ...overrides,
});

describe("DrizzleProposalsActivityRepository", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: DrizzleProposalsActivityRepository;

  beforeAll(async () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new DrizzleProposalsActivityRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    // Delete votes before proposals due to FK relation
    await db.delete(votesOnchain);
    await db.delete(proposalsOnchain);
  });

  describe("getFirstVoteTimestamp", () => {
    it("returns null when no votes exist for the address", async () => {
      const result = await repository.getFirstVoteTimestamp(VOTER);
      expect(result).toBeNull();
    });

    it("returns the earliest vote timestamp for the address", async () => {
      await db
        .insert(proposalsOnchain)
        .values([
          createProposal({ id: "proposal-1" }),
          createProposal({ id: "proposal-2", txHash: "0xtx2" }),
        ]);

      await db.insert(votesOnchain).values([
        createVote({
          txHash: "0xvote1",
          proposalId: "proposal-1",
          timestamp: 1700000000n,
        }),
        createVote({
          txHash: "0xvote2",
          proposalId: "proposal-2",
          timestamp: 1699000000n,
        }),
      ]);

      const result = await repository.getFirstVoteTimestamp(VOTER);
      expect(result).toBe(1699000000);
    });
  });

  describe("getUserVotes", () => {
    it("returns empty array when proposalIds is empty", async () => {
      const result = await repository.getUserVotes(VOTER, DaoIdEnum.UNI, []);
      expect(result).toHaveLength(0);
    });

    it("filters out votes for other addresses", async () => {
      await db.insert(proposalsOnchain).values(createProposal());
      await db
        .insert(votesOnchain)
        .values([
          createVote({ txHash: "0xvoteA", voterAccountId: VOTER }),
          createVote({ txHash: "0xvoteB", voterAccountId: OTHER_VOTER }),
        ]);

      const result = await repository.getUserVotes(VOTER, DaoIdEnum.UNI, [
        "proposal-1",
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("0xvoteA");
    });

    it("filters out votes for other daoIds", async () => {
      await db
        .insert(proposalsOnchain)
        .values([
          createProposal({ id: "proposal-uni", txHash: "0xtx1", daoId: "UNI" }),
          createProposal({ id: "proposal-arb", txHash: "0xtx2", daoId: "ARB" }),
        ]);
      await db.insert(votesOnchain).values([
        createVote({
          txHash: "0xvoteUni",
          proposalId: "proposal-uni",
          daoId: "UNI",
        }),
        createVote({
          txHash: "0xvoteArb",
          proposalId: "proposal-arb",
          daoId: "ARB",
        }),
      ]);

      const result = await repository.getUserVotes(VOTER, DaoIdEnum.UNI, [
        "proposal-uni",
        "proposal-arb",
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("0xvoteUni");
    });

    it("returns only votes for the specified proposalIds", async () => {
      await db
        .insert(proposalsOnchain)
        .values([
          createProposal({ id: "proposal-1", txHash: "0xtx1" }),
          createProposal({ id: "proposal-2", txHash: "0xtx2" }),
        ]);
      await db
        .insert(votesOnchain)
        .values([
          createVote({ txHash: "0xvote1", proposalId: "proposal-1" }),
          createVote({ txHash: "0xvote2", proposalId: "proposal-2" }),
        ]);

      const result = await repository.getUserVotes(VOTER, DaoIdEnum.UNI, [
        "proposal-1",
      ]);

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("0xvote1");
    });

    it("returns multiple votes when multiple proposalIds match", async () => {
      await db
        .insert(proposalsOnchain)
        .values([
          createProposal({ id: "proposal-1", txHash: "0xtx1" }),
          createProposal({ id: "proposal-2", txHash: "0xtx2" }),
          createProposal({ id: "proposal-3", txHash: "0xtx3" }),
        ]);
      await db
        .insert(votesOnchain)
        .values([
          createVote({ txHash: "0xvote1", proposalId: "proposal-1" }),
          createVote({ txHash: "0xvote2", proposalId: "proposal-2" }),
          createVote({ txHash: "0xvote3", proposalId: "proposal-3" }),
        ]);

      const result = await repository.getUserVotes(VOTER, DaoIdEnum.UNI, [
        "proposal-1",
        "proposal-2",
        "proposal-3",
      ]);

      expect(result).toHaveLength(3);
      const ids = result.map((v) => v.id).sort();
      expect(ids).toEqual(["0xvote1", "0xvote2", "0xvote3"]);
    });
  });

  describe("getProposals", () => {
    it("returns proposals whose computed end timestamp is at or after activityStart", async () => {
      await db.insert(proposalsOnchain).values([
        createProposal({
          id: "proposal-1",
          txHash: "0xtx1",
          timestamp: 1699900000n,
        }),
        createProposal({
          id: "proposal-2",
          txHash: "0xtx2",
          timestamp: 1699800000n,
        }),
      ]);

      const result = await repository.getProposals(
        DaoIdEnum.UNI,
        1699950000,
        100000,
      );

      expect(result).toHaveLength(1);
      expect(result[0]?.id).toBe("proposal-1");
    });

    it("returns empty array when no proposals meet the activityStart threshold", async () => {
      await db
        .insert(proposalsOnchain)
        .values(createProposal({ timestamp: 1699000000n }));

      const result = await repository.getProposals(
        DaoIdEnum.UNI,
        9999999999,
        100,
      );

      expect(result).toHaveLength(0);
    });
  });
});
