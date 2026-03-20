import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { getAddress } from "viem";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import {
  accountPower,
  proposalsOnchain,
  votesOnchain,
  votingPowerHistory,
} from "@/database/schema";
import { VotesRepository } from "@/repositories/votes/onchainVotes";
import { VotesService } from "@/services";
import { votes } from "./onchainVotes";

const VOTER_ADDRESS = getAddress("0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa");
const SECOND_VOTER = getAddress("0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB");

type ProposalInsert = typeof proposalsOnchain.$inferInsert;
type VoteInsert = typeof votesOnchain.$inferInsert;
type AccountPowerInsert = typeof accountPower.$inferInsert;

const createProposal = (
  overrides: Partial<ProposalInsert> = {},
): ProposalInsert => ({
  id: "1",
  txHash: "0xabc123",
  daoId: "ENS",
  proposerAccountId: getAddress("0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"),
  targets: ["0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"],
  values: [0] as unknown as bigint[],
  signatures: [""],
  calldatas: ["0x"],
  startBlock: 10,
  endBlock: 110,
  title: "Test Proposal",
  description: "A test proposal description",
  timestamp: 1700000000n,
  endTimestamp: 1700100000n,
  status: "PENDING",
  forVotes: 5000n,
  againstVotes: 1000n,
  abstainVotes: 500n,
  proposalType: null,
  ...overrides,
});

const createVote = (overrides: Partial<VoteInsert> = {}): VoteInsert => ({
  txHash: "0xabc123",
  daoId: "ENS",
  voterAccountId: VOTER_ADDRESS,
  proposalId: "1",
  support: "1",
  votingPower: 1000000000000000000n,
  reason: null,
  timestamp: 1700000000n,
  ...overrides,
});

const createAccountPower = (
  overrides: Partial<AccountPowerInsert> = {},
): AccountPowerInsert => ({
  accountId: VOTER_ADDRESS,
  daoId: "ENS",
  votingPower: 1000000000000000000n,
  votesCount: 0,
  proposalsCount: 0,
  delegationsCount: 0,
  lastVoteTimestamp: 0n,
  ...overrides,
});

const FULL_VOTE_OBJECT = {
  voterAddress: VOTER_ADDRESS,
  transactionHash: "0xabc123",
  proposalId: "1",
  support: 1,
  votingPower: "1000000000000000000",
  reason: null,
  timestamp: 1700000000,
  proposalTitle: "Test Proposal",
};

let client: PGlite;
let db: Drizzle;
let app: Hono;

beforeAll(async () => {
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
  client = new PGlite();
  db = drizzle(client, { schema });
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

  const repo = new VotesRepository(db);
  const service = new VotesService(repo);
  app = new Hono();
  votes(app, service);
});

describe("Onchain Votes Controller", () => {
  describe("GET /proposals/{id}/votes", () => {
    it("should return 200 with votes for a proposal", async () => {
      await db.insert(proposalsOnchain).values(createProposal({ id: "1" }));
      await db.insert(votesOnchain).values(createVote({ proposalId: "1" }));

      const res = await app.request("/proposals/1/votes");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        totalCount: 1,
        items: [
          {
            voterAddress: VOTER_ADDRESS,
            transactionHash: "0xabc123",
            proposalId: "1",
            support: 1,
            votingPower: "1000000000000000000",
            reason: null,
            timestamp: 1700000000,
            proposalTitle: "Test Proposal",
          },
        ],
      });
    });

    it("should return 200 with empty items when no votes", async () => {
      const res = await app.request("/proposals/1/votes");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [], totalCount: 0 });
    });

    it("should accept pagination parameters", async () => {
      await db.insert(proposalsOnchain).values(createProposal({ id: "1" }));
      await db.insert(votesOnchain).values(createVote({ proposalId: "1" }));

      const res = await app.request("/proposals/1/votes?skip=0&limit=10");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [FULL_VOTE_OBJECT], totalCount: 1 });
    });

    it("should accept voterAddressIn filter", async () => {
      await db.insert(proposalsOnchain).values(createProposal({ id: "1" }));
      await db.insert(votesOnchain).values([
        createVote({ proposalId: "1", voterAccountId: VOTER_ADDRESS }),
        createVote({
          proposalId: "1",
          voterAccountId: SECOND_VOTER,
          txHash: "0xdef456",
        }),
      ]);

      const res = await app.request(
        `/proposals/1/votes?voterAddressIn=${VOTER_ADDRESS}`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only VOTER_ADDRESS's vote is returned
      expect(body).toEqual({
        totalCount: 1,
        items: [FULL_VOTE_OBJECT],
      });
    });

    it("should accept support filter", async () => {
      await db.insert(proposalsOnchain).values(createProposal({ id: "1" }));
      await db.insert(votesOnchain).values([
        createVote({
          proposalId: "1",
          voterAccountId: VOTER_ADDRESS,
          support: "1",
        }),
        createVote({
          proposalId: "1",
          voterAccountId: SECOND_VOTER,
          support: "0",
          txHash: "0xdef456",
        }),
      ]);

      const res = await app.request("/proposals/1/votes?support=1");

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only the vote with support=1 is returned
      expect(body).toEqual({
        totalCount: 1,
        items: [FULL_VOTE_OBJECT],
      });
    });

    it("should accept orderBy=votingPower", async () => {
      await db.insert(proposalsOnchain).values(createProposal({ id: "1" }));
      await db.insert(votesOnchain).values([
        createVote({
          proposalId: "1",
          voterAccountId: VOTER_ADDRESS,
          votingPower: 1000n,
        }),
        createVote({
          proposalId: "1",
          voterAccountId: SECOND_VOTER,
          votingPower: 2000n,
          txHash: "0xdef456",
        }),
      ]);

      const res = await app.request(
        "/proposals/1/votes?orderBy=votingPower&orderDirection=desc",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // desc by votingPower: larger (2000) first
      expect(body).toEqual({
        totalCount: 2,
        items: [
          {
            voterAddress: SECOND_VOTER,
            transactionHash: "0xdef456",
            proposalId: "1",
            support: 1,
            votingPower: "2000",
            reason: null,
            timestamp: 1700000000,
            proposalTitle: "Test Proposal",
          },
          {
            voterAddress: VOTER_ADDRESS,
            transactionHash: "0xabc123",
            proposalId: "1",
            support: 1,
            votingPower: "1000",
            reason: null,
            timestamp: 1700000000,
            proposalTitle: "Test Proposal",
          },
        ],
      });
    });
  });

  describe("GET /votes", () => {
    it("should return 200 with all votes", async () => {
      await db.insert(proposalsOnchain).values(createProposal({ id: "1" }));
      await db.insert(votesOnchain).values(createVote({ proposalId: "1" }));

      const res = await app.request("/votes");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        totalCount: 1,
        items: [
          {
            voterAddress: VOTER_ADDRESS,
            transactionHash: "0xabc123",
            proposalId: "1",
            support: 1,
            votingPower: "1000000000000000000",
            reason: null,
            timestamp: 1700000000,
            proposalTitle: "Test Proposal",
          },
        ],
      });
    });

    it("should return 200 with empty items when no votes", async () => {
      const res = await app.request("/votes");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [], totalCount: 0 });
    });

    it("should accept pagination parameters", async () => {
      await db.insert(proposalsOnchain).values(createProposal({ id: "1" }));
      await db.insert(votesOnchain).values(createVote({ proposalId: "1" }));

      const res = await app.request("/votes?skip=0&limit=5");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [FULL_VOTE_OBJECT], totalCount: 1 });
    });
  });

  describe("GET /proposals/{id}/non-voters", () => {
    it("should return 200 with non-voters", async () => {
      await db.insert(proposalsOnchain).values(createProposal({ id: "1" }));
      await db.insert(accountPower).values(createAccountPower());
      // VOTER_ADDRESS has not voted on proposal 1, so they're a non-voter

      const res = await app.request("/proposals/1/non-voters");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        totalCount: 1,
        items: [
          {
            voter: VOTER_ADDRESS,
            votingPower: "1000000000000000000",
            lastVoteTimestamp: 0,
            votingPowerVariation: "0",
          },
        ],
      });
    });

    it("should return 200 with empty items when no non-voters", async () => {
      const res = await app.request("/proposals/1/non-voters");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [], totalCount: 0 });
    });

    it("should accept addresses filter", async () => {
      await db.insert(proposalsOnchain).values(createProposal({ id: "1" }));
      await db.insert(accountPower).values(createAccountPower());

      const res = await app.request(
        `/proposals/1/non-voters?addresses=${VOTER_ADDRESS}`,
      );

      expect(res.status).toBe(200);
    });
  });
});
