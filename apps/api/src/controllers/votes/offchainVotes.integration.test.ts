import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { OffchainDrizzle } from "@/database";
import * as offchainSchema from "@/database/offchain-schema";
import { offchainProposals, offchainVotes } from "@/database/offchain-schema";
import { OffchainVoteRepository } from "@/repositories/votes/offchainVotes";
import { OffchainVotesService } from "@/services/votes/offchainVotes";
import { offchainVotes as offchainVotesController } from "./offchainVotes";

let client: PGlite;
let db: OffchainDrizzle;
let app: Hono;

type OffchainVoteInsert = typeof offchainVotes.$inferInsert;
type OffchainProposalInsert = typeof offchainProposals.$inferInsert;

const VOTER = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";

const FULL_VOTE_ITEM = {
  voter: VOTER,
  proposalId: "proposal-1",
  choice: { "1": 1 },
  vp: 100,
  reason: "",
  created: 1700000000,
  proposalTitle: "Test Proposal",
};

const createVote = (
  overrides: Partial<OffchainVoteInsert> = {},
): OffchainVoteInsert => ({
  spaceId: "ens.eth",
  voter: VOTER,
  proposalId: "proposal-1",
  choice: { "1": 1 },
  vp: "100",
  reason: "",
  created: 1700000000,
  ...overrides,
});

const createOffchainProposal = (
  overrides: Partial<OffchainProposalInsert> = {},
): OffchainProposalInsert => ({
  id: "proposal-1",
  spaceId: "ens.eth",
  author: VOTER,
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

beforeAll(async () => {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
  client = new PGlite();
  db = drizzle(client, { schema: offchainSchema });
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

  const repo = new OffchainVoteRepository(db);
  const service = new OffchainVotesService(repo);
  app = new Hono();
  offchainVotesController(app, service);
});

describe("Offchain Votes Controller", () => {
  describe("GET /offchain/votes", () => {
    it("should return 200 with correct response shape", async () => {
      await db.insert(offchainProposals).values(createOffchainProposal());
      await db.insert(offchainVotes).values(createVote());

      const res = await app.request("/offchain/votes");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [FULL_VOTE_ITEM], totalCount: 1 });
    });

    it("should return 200 with empty items when no data", async () => {
      const res = await app.request("/offchain/votes");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [], totalCount: 0 });
    });

    it("should accept all query params", async () => {
      await db.insert(offchainProposals).values(createOffchainProposal());
      await db.insert(offchainVotes).values(createVote());

      const res = await app.request(
        `/offchain/votes?skip=0&limit=5&orderBy=votingPower&orderDirection=asc&voterAddresses=${VOTER}&fromDate=1000&toDate=5000`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // vote.created=1700000000 > toDate=5000, so filtered out
      expect(body).toEqual({ items: [], totalCount: 0 });
    });
  });

  describe("GET /offchain/proposals/{id}/votes", () => {
    it("should return 200 with votes for given proposal", async () => {
      await db
        .insert(offchainProposals)
        .values(createOffchainProposal({ id: "p-1" }));
      await db
        .insert(offchainProposals)
        .values(createOffchainProposal({ id: "p-2" }));
      await db.insert(offchainVotes).values(createVote({ proposalId: "p-1" }));
      await db.insert(offchainVotes).values(
        createVote({
          proposalId: "p-2",
          voter: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        }),
      );

      const res = await app.request("/offchain/proposals/p-1/votes");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [{ ...FULL_VOTE_ITEM, proposalId: "p-1" }],
        totalCount: 1,
      });
    });

    it("should return 200 with empty items when no votes", async () => {
      const res = await app.request("/offchain/proposals/nonexistent/votes");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [], totalCount: 0 });
    });
  });
});
