import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { getAddress } from "viem";

import type { UnifiedDrizzle } from "@/database";
import * as offchainSchema from "@/database/offchain-schema";
import * as schema from "@/database/schema";
import { accountPower } from "@/database/schema";
import { offchainVotes, offchainProposals } from "@/database/offchain-schema";

import { OffchainNonVotersRepositoryImpl } from "./offchainNonVoters";

type AccountPowerInsert = typeof accountPower.$inferInsert;
type ProposalInsert = typeof offchainProposals.$inferInsert;
type VoteInsert = typeof offchainVotes.$inferInsert;

const VOTER_A = getAddress("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
const VOTER_B = getAddress("0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb");
const VOTER_C = getAddress("0xcccccccccccccccccccccccccccccccccccccccc");
const PROPOSAL_1 = "snapshot-proposal-1";
const DAO_ID = "test-dao";
const SPACE_ID = "test.eth";

const createAccountPower = (
  overrides: Partial<AccountPowerInsert> = {},
): AccountPowerInsert => ({
  accountId: VOTER_A,
  daoId: DAO_ID,
  votingPower: 100n,
  votesCount: 0,
  proposalsCount: 0,
  delegationsCount: 0,
  lastVoteTimestamp: 0n,
  ...overrides,
});

const createProposal = (
  overrides: Partial<ProposalInsert> = {},
): ProposalInsert => ({
  id: PROPOSAL_1,
  spaceId: SPACE_ID,
  author: VOTER_A,
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
  spaceId: SPACE_ID,
  voter: VOTER_A,
  proposalId: PROPOSAL_1,
  choice: { "1": 1 },
  vp: "100",
  reason: "",
  created: 1700000000,
  ...overrides,
});

describe("OffchainNonVotersRepositoryImpl", () => {
  let client: PGlite;
  let db: UnifiedDrizzle;
  let repository: OffchainNonVotersRepositoryImpl;

  beforeAll(async () => {
    client = new PGlite();
    const combinedSchema = { ...schema, ...offchainSchema };

    db = drizzle(client, { schema: combinedSchema });

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(combinedSchema, db as any);
    await apply();

    repository = new OffchainNonVotersRepositoryImpl(db);
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(offchainVotes);
    await db.delete(offchainProposals);
    await db.delete(accountPower);
  });

  describe("getOffchainNonVoters", () => {
    it("returns delegates who did NOT vote on a proposal", async () => {
      // VOTER_A and VOTER_B are delegates; VOTER_A votes, VOTER_B doesn't
      await db
        .insert(accountPower)
        .values([
          createAccountPower({ accountId: VOTER_A, votingPower: 100n }),
          createAccountPower({ accountId: VOTER_B, votingPower: 200n }),
        ]);
      await db.insert(offchainProposals).values(createProposal());
      await db
        .insert(offchainVotes)
        .values(createVote({ voter: VOTER_A, proposalId: PROPOSAL_1 }));

      const result = await repository.getOffchainNonVoters(
        PROPOSAL_1,
        0,
        10,
        "desc",
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.voter).toBe(VOTER_B);
    });

    it("excludes delegates with zero voting power", async () => {
      await db
        .insert(accountPower)
        .values([
          createAccountPower({ accountId: VOTER_A, votingPower: 0n }),
          createAccountPower({ accountId: VOTER_B, votingPower: 100n }),
        ]);
      await db.insert(offchainProposals).values(createProposal());

      const result = await repository.getOffchainNonVoters(
        PROPOSAL_1,
        0,
        10,
        "desc",
      );

      // VOTER_A has zero power and should be excluded
      expect(result).toHaveLength(1);
      expect(result[0]!.voter).toBe(VOTER_B);
    });

    it("orders by voting power desc", async () => {
      await db
        .insert(accountPower)
        .values([
          createAccountPower({ accountId: VOTER_A, votingPower: 50n }),
          createAccountPower({ accountId: VOTER_B, votingPower: 300n }),
          createAccountPower({ accountId: VOTER_C, votingPower: 150n }),
        ]);
      await db.insert(offchainProposals).values(createProposal());

      const result = await repository.getOffchainNonVoters(
        PROPOSAL_1,
        0,
        10,
        "desc",
      );

      expect(result).toHaveLength(3);
      expect(result[0]!.votingPower).toBe(300n);
      expect(result[1]!.votingPower).toBe(150n);
      expect(result[2]!.votingPower).toBe(50n);
    });

    it("orders by voting power asc", async () => {
      await db
        .insert(accountPower)
        .values([
          createAccountPower({ accountId: VOTER_A, votingPower: 50n }),
          createAccountPower({ accountId: VOTER_B, votingPower: 300n }),
          createAccountPower({ accountId: VOTER_C, votingPower: 150n }),
        ]);
      await db.insert(offchainProposals).values(createProposal());

      const result = await repository.getOffchainNonVoters(
        PROPOSAL_1,
        0,
        10,
        "asc",
      );

      expect(result).toHaveLength(3);
      expect(result[0]!.votingPower).toBe(50n);
      expect(result[1]!.votingPower).toBe(150n);
      expect(result[2]!.votingPower).toBe(300n);
    });

    it("applies skip and limit for pagination", async () => {
      await db
        .insert(accountPower)
        .values([
          createAccountPower({ accountId: VOTER_A, votingPower: 50n }),
          createAccountPower({ accountId: VOTER_B, votingPower: 300n }),
          createAccountPower({ accountId: VOTER_C, votingPower: 150n }),
        ]);
      await db.insert(offchainProposals).values(createProposal());

      // desc order: VOTER_B (300), VOTER_C (150), VOTER_A (50)
      // skip=1, limit=1 → only VOTER_C
      const result = await repository.getOffchainNonVoters(
        PROPOSAL_1,
        1,
        1,
        "desc",
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.voter).toBe(VOTER_C);
      expect(result[0]!.votingPower).toBe(150n);
    });

    it("filters by addresses", async () => {
      await db
        .insert(accountPower)
        .values([
          createAccountPower({ accountId: VOTER_A, votingPower: 100n }),
          createAccountPower({ accountId: VOTER_B, votingPower: 200n }),
          createAccountPower({ accountId: VOTER_C, votingPower: 300n }),
        ]);
      await db.insert(offchainProposals).values(createProposal());

      // Only include VOTER_A and VOTER_C
      const result = await repository.getOffchainNonVoters(
        PROPOSAL_1,
        0,
        10,
        "desc",
        [VOTER_A, VOTER_C],
      );

      expect(result).toHaveLength(2);
      const voters = result.map((r) => r.voter);
      expect(voters).toContain(VOTER_A);
      expect(voters).toContain(VOTER_C);
      expect(voters).not.toContain(VOTER_B);
    });

    it("returns empty when all delegates voted", async () => {
      await db
        .insert(accountPower)
        .values([
          createAccountPower({ accountId: VOTER_A, votingPower: 100n }),
          createAccountPower({ accountId: VOTER_B, votingPower: 200n }),
        ]);
      await db.insert(offchainProposals).values(createProposal());
      await db
        .insert(offchainVotes)
        .values([
          createVote({ voter: VOTER_A, proposalId: PROPOSAL_1 }),
          createVote({ voter: VOTER_B, proposalId: PROPOSAL_1 }),
        ]);

      const result = await repository.getOffchainNonVoters(
        PROPOSAL_1,
        0,
        10,
        "desc",
      );

      expect(result).toHaveLength(0);
    });
  });

  describe("getOffchainNonVotersCount", () => {
    it("returns count of non-voters", async () => {
      // Three delegates, one votes → two non-voters
      await db
        .insert(accountPower)
        .values([
          createAccountPower({ accountId: VOTER_A, votingPower: 100n }),
          createAccountPower({ accountId: VOTER_B, votingPower: 200n }),
          createAccountPower({ accountId: VOTER_C, votingPower: 300n }),
        ]);
      await db.insert(offchainProposals).values(createProposal());
      await db
        .insert(offchainVotes)
        .values(createVote({ voter: VOTER_A, proposalId: PROPOSAL_1 }));

      const count = await repository.getOffchainNonVotersCount(PROPOSAL_1);

      expect(count).toBe(2);
    });

    it("returns 0 when all delegates voted", async () => {
      await db
        .insert(accountPower)
        .values([
          createAccountPower({ accountId: VOTER_A, votingPower: 100n }),
          createAccountPower({ accountId: VOTER_B, votingPower: 200n }),
        ]);
      await db.insert(offchainProposals).values(createProposal());
      await db
        .insert(offchainVotes)
        .values([
          createVote({ voter: VOTER_A, proposalId: PROPOSAL_1 }),
          createVote({ voter: VOTER_B, proposalId: PROPOSAL_1 }),
        ]);

      const count = await repository.getOffchainNonVotersCount(PROPOSAL_1);

      expect(count).toBe(0);
    });
  });
});
