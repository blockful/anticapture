import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";

import * as offchainSchema from "@/database/offchain-schema";
import { offchainProposals, offchainVotes } from "@/database/offchain-schema";

import { OffchainVoteRepository } from "./offchainVotes";

type ProposalInsert = typeof offchainProposals.$inferInsert;
type VoteInsert = typeof offchainVotes.$inferInsert;

const VOTER_A = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const VOTER_B = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const PROPOSAL_1 = "proposal-1";
const PROPOSAL_2 = "proposal-2";

const createProposal = (
  overrides: Partial<ProposalInsert> = {},
): ProposalInsert => ({
  id: "default-proposal",
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

const createVote = (overrides: Partial<VoteInsert> = {}): VoteInsert => ({
  spaceId: "ens.eth",
  voter: VOTER_A,
  proposalId: PROPOSAL_1,
  choice: { "1": 1 },
  vp: "100",
  reason: "",
  created: 1700000000,
  ...overrides,
});

describe("OffchainVoteRepository", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof offchainSchema>>;
  let repository: OffchainVoteRepository;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema: offchainSchema });
    repository = new OffchainVoteRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(offchainSchema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(offchainVotes);
    await db.delete(offchainProposals);
  });

  describe("getVotes", () => {
    it("should return votes with proposalTitle", async () => {
      await db
        .insert(offchainProposals)
        .values(createProposal({ id: PROPOSAL_1, title: "ens Fee Switch" }));
      await db
        .insert(offchainVotes)
        .values(createVote({ voter: VOTER_A, proposalId: PROPOSAL_1 }));

      const result = await repository.getVotes(0, 10, "created", "desc");

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.proposalTitle).toBe("ens Fee Switch");
      expect(result.totalCount).toBe(1);
    });

    it("should return proposalTitle as null when proposal not found", async () => {
      await db
        .insert(offchainVotes)
        .values(createVote({ voter: VOTER_A, proposalId: "orphan-proposal" }));

      const result = await repository.getVotes(0, 10, "created", "desc");

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.proposalTitle).toBeNull();
    });

    it("should filter by voterAddresses", async () => {
      await db
        .insert(offchainProposals)
        .values(createProposal({ id: PROPOSAL_1 }));
      await db
        .insert(offchainVotes)
        .values([
          createVote({ voter: VOTER_A, proposalId: PROPOSAL_1 }),
          createVote({ voter: VOTER_B, proposalId: PROPOSAL_1 }),
        ]);

      const result = await repository.getVotes(0, 10, "created", "desc", [
        VOTER_A,
      ]);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.voter).toBe(VOTER_A);
      expect(result.totalCount).toBe(1);
    });

    it("should filter by fromDate and toDate range", async () => {
      await db
        .insert(offchainProposals)
        .values(createProposal({ id: PROPOSAL_1 }));
      await db
        .insert(offchainVotes)
        .values([
          createVote({ voter: VOTER_A, proposalId: PROPOSAL_1, created: 1000 }),
          createVote({ voter: VOTER_B, proposalId: PROPOSAL_1, created: 3000 }),
        ]);

      const result = await repository.getVotes(
        0,
        10,
        "created",
        "desc",
        undefined,
        2000,
        4000,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.voter).toBe(VOTER_B);
      expect(result.totalCount).toBe(1);
    });

    it("should order by created desc by default", async () => {
      await db
        .insert(offchainProposals)
        .values(createProposal({ id: PROPOSAL_1 }));
      await db
        .insert(offchainVotes)
        .values([
          createVote({ voter: VOTER_A, proposalId: PROPOSAL_1, created: 1000 }),
          createVote({ voter: VOTER_B, proposalId: PROPOSAL_1, created: 3000 }),
        ]);

      const result = await repository.getVotes(0, 10, "created", "desc");

      expect(result.items[0]!.voter).toBe(VOTER_B);
      expect(result.items[1]!.voter).toBe(VOTER_A);
    });

    it("should order by created asc", async () => {
      await db
        .insert(offchainProposals)
        .values(createProposal({ id: PROPOSAL_1 }));
      await db
        .insert(offchainVotes)
        .values([
          createVote({ voter: VOTER_A, proposalId: PROPOSAL_1, created: 1000 }),
          createVote({ voter: VOTER_B, proposalId: PROPOSAL_1, created: 3000 }),
        ]);

      const result = await repository.getVotes(0, 10, "created", "asc");

      expect(result.items[0]!.voter).toBe(VOTER_A);
      expect(result.items[1]!.voter).toBe(VOTER_B);
    });

    it("should order by vp", async () => {
      await db
        .insert(offchainProposals)
        .values(createProposal({ id: PROPOSAL_1 }));
      await db
        .insert(offchainVotes)
        .values([
          createVote({ voter: VOTER_A, proposalId: PROPOSAL_1, vp: "50" }),
          createVote({ voter: VOTER_B, proposalId: PROPOSAL_1, vp: "200" }),
        ]);

      const result = await repository.getVotes(0, 10, "vp", "desc");

      expect(result.items[0]!.voter).toBe(VOTER_B);
      expect(result.items[1]!.voter).toBe(VOTER_A);
    });

    it("should apply skip and limit with totalCount independent", async () => {
      await db
        .insert(offchainProposals)
        .values(createProposal({ id: PROPOSAL_1 }));
      await db
        .insert(offchainVotes)
        .values([
          createVote({ voter: VOTER_A, proposalId: PROPOSAL_1, created: 3000 }),
          createVote({ voter: VOTER_B, proposalId: PROPOSAL_1, created: 1000 }),
        ]);

      const result = await repository.getVotes(1, 1, "created", "desc");

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.voter).toBe(VOTER_B);
      expect(result.totalCount).toBe(2);
    });

    it("should return empty when no data", async () => {
      const result = await repository.getVotes(0, 10, "created", "desc");

      expect(result).toEqual({ items: [], totalCount: 0 });
    });
  });

  describe("getVotesByProposalId", () => {
    it("should return only votes for given proposalId", async () => {
      await db
        .insert(offchainProposals)
        .values([
          createProposal({ id: PROPOSAL_1, title: "Proposal One" }),
          createProposal({ id: PROPOSAL_2, title: "Proposal Two" }),
        ]);
      await db
        .insert(offchainVotes)
        .values([
          createVote({ voter: VOTER_A, proposalId: PROPOSAL_1 }),
          createVote({ voter: VOTER_B, proposalId: PROPOSAL_2 }),
        ]);

      const result = await repository.getVotesByProposalId(
        PROPOSAL_1,
        0,
        10,
        "created",
        "desc",
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.proposalId).toBe(PROPOSAL_1);
      expect(result.items[0]!.proposalTitle).toBe("Proposal One");
      expect(result.totalCount).toBe(1);
    });

    it("should filter by voterAddresses within a proposal", async () => {
      await db
        .insert(offchainProposals)
        .values(createProposal({ id: PROPOSAL_1 }));
      await db
        .insert(offchainVotes)
        .values([
          createVote({ voter: VOTER_A, proposalId: PROPOSAL_1 }),
          createVote({ voter: VOTER_B, proposalId: PROPOSAL_1 }),
        ]);

      const result = await repository.getVotesByProposalId(
        PROPOSAL_1,
        0,
        10,
        "created",
        "desc",
        [VOTER_B],
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.voter).toBe(VOTER_B);
      expect(result.totalCount).toBe(1);
    });
  });
});
