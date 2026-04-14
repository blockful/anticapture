import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { getAddress } from "viem";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";

import { DAOClient } from "@/clients";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { proposalsOnchain, votesOnchain } from "@/database/schema";
import { DaoIdEnum } from "@/lib/enums";
import { DrizzleProposalsActivityRepository } from "@/repositories/proposals-activity";

import { proposalsActivity } from "./proposals-activity";

class FakeDAOClient implements DAOClient {
  getDaoId(): string {
    return "ENS";
  }
  async getVotingDelay(): Promise<bigint> {
    return 1n;
  }
  async getVotingPeriod(): Promise<bigint> {
    return 100n;
  }
  async getTimelockDelay(): Promise<bigint> {
    return 1n;
  }
  async getQuorum(): Promise<bigint> {
    return 1000n;
  }
  async getProposalThreshold(): Promise<bigint> {
    return 100n;
  }
  async getCurrentBlockNumber(): Promise<number> {
    return 100;
  }
  async getBlockTime(): Promise<number | null> {
    return 1700000000;
  }
  alreadySupportCalldataReview(): boolean {
    return false;
  }
  supportOffchainData(): boolean {
    return false;
  }
  calculateQuorum(): bigint {
    return 0n;
  }
  async getProposalStatus(): Promise<string> {
    return "ACTIVE";
  }
}

const VALID_ADDRESS = getAddress("0x1234567890123456789012345678901234567890");

type ProposalInsert = typeof proposalsOnchain.$inferInsert;
type VoteInsert = typeof votesOnchain.$inferInsert;

const createProposal = (
  overrides: Partial<ProposalInsert> = {},
): ProposalInsert => ({
  id: "1",
  txHash: "0xabc123",
  daoId: "ENS",
  proposerAccountId: getAddress("0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa"),
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
  status: "EXECUTED",
  forVotes: 5000n,
  againstVotes: 1000n,
  abstainVotes: 500n,
  proposalType: null,
  ...overrides,
});

const createVote = (overrides: Partial<VoteInsert> = {}): VoteInsert => ({
  id: "0xvote123",
  txHash: "0xvote123",
  daoId: "ENS",
  voterAccountId: VALID_ADDRESS,
  proposalId: "1",
  support: "1",
  votingPower: 1000000000000000000n,
  reason: "",
  // Must be < proposal.timestamp + votingPeriodSeconds (1700000000 + 1212 = 1700001212)
  timestamp: 1700000100n,
  ...overrides,
});

let client: PGlite;
let db: Drizzle;
let app: Hono;
let fakeClient: FakeDAOClient;

beforeAll(async () => {
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

  fakeClient = new FakeDAOClient();
  const repo = new DrizzleProposalsActivityRepository(db);
  app = new Hono();
  proposalsActivity(app, repo as never, DaoIdEnum.ENS, fakeClient);
});

describe("Proposals Activity Controller", () => {
  describe("GET /proposals-activity", () => {
    it("should return 200 with activity data", async () => {
      await db.insert(proposalsOnchain).values(createProposal());
      await db.insert(votesOnchain).values(createVote());

      const res = await app.request(
        `/proposals-activity?address=${VALID_ADDRESS}`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        address: VALID_ADDRESS,
        neverVoted: false,
        totalProposals: 1,
        votedProposals: 1,
        winRate: 100,
        yesRate: 100,
        avgTimeBeforeEnd: 1112,
        proposals: [
          {
            proposal: {
              id: "1",
              daoId: "ENS",
              proposerAccountId: getAddress(
                "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa",
              ),
              title: "Test Proposal",
              description: "A test proposal description",
              startBlock: 10,
              endBlock: 110,
              timestamp: "1700000000",
              status: "ACTIVE",
              forVotes: "5000",
              againstVotes: "1000",
              abstainVotes: "500",
            },
            userVote: {
              id: "0xvote123",
              voterAccountId: VALID_ADDRESS,
              proposalId: "1",
              support: "1",
              votingPower: "1000000000000000000",
              reason: "",
              timestamp: "1700000100",
            },
          },
        ],
      });
    });

    it("should return empty activity when user never voted", async () => {
      const res = await app.request(
        `/proposals-activity?address=${VALID_ADDRESS}`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        address: VALID_ADDRESS,
        neverVoted: true,
        totalProposals: 0,
        votedProposals: 0,
        winRate: 0,
        yesRate: 0,
        avgTimeBeforeEnd: 0,
        proposals: [],
      });
    });

    it("should return 400 for invalid address", async () => {
      const res = await app.request("/proposals-activity?address=not-valid");

      expect(res.status).toBe(400);
    });

    it("should accept orderBy and orderDirection parameters", async () => {
      await db.insert(proposalsOnchain).values(createProposal());
      await db.insert(votesOnchain).values(createVote());

      const res = await app.request(
        `/proposals-activity?address=${VALID_ADDRESS}&orderBy=votingPower&orderDirection=asc`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        address: VALID_ADDRESS,
        neverVoted: false,
        totalProposals: 1,
        votedProposals: 1,
        winRate: 100,
        yesRate: 100,
        avgTimeBeforeEnd: 1112,
        proposals: [
          {
            proposal: {
              id: "1",
              daoId: "ENS",
              proposerAccountId: getAddress(
                "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa",
              ),
              title: "Test Proposal",
              description: "A test proposal description",
              startBlock: 10,
              endBlock: 110,
              timestamp: "1700000000",
              status: "ACTIVE",
              forVotes: "5000",
              againstVotes: "1000",
              abstainVotes: "500",
            },
            userVote: {
              id: "0xvote123",
              voterAccountId: VALID_ADDRESS,
              proposalId: "1",
              support: "1",
              votingPower: "1000000000000000000",
              reason: "",
              timestamp: "1700000100",
            },
          },
        ],
      });
    });

    it("should accept pagination parameters", async () => {
      const res = await app.request(
        `/proposals-activity?address=${VALID_ADDRESS}&skip=5&limit=10`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        address: VALID_ADDRESS,
        neverVoted: true,
        totalProposals: 0,
        votedProposals: 0,
        winRate: 0,
        yesRate: 0,
        avgTimeBeforeEnd: 0,
        proposals: [],
      });
    });

    it("should accept fromDate parameter", async () => {
      await db.insert(proposalsOnchain).values(createProposal());
      await db.insert(votesOnchain).values(createVote());

      // fromDate=1700002000 is after proposal window end (1700000000 + 1212 = 1700001212)
      // so this proposal is filtered out
      const res = await app.request(
        `/proposals-activity?address=${VALID_ADDRESS}&fromDate=1700002000`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // fromDate=1700002000 is after proposal window end so no proposals in range;
      // neverVoted=false because the user has voted before (vote exists in DB)
      expect(body).toEqual({
        address: VALID_ADDRESS,
        neverVoted: false,
        totalProposals: 0,
        votedProposals: 0,
        winRate: 0,
        yesRate: 0,
        avgTimeBeforeEnd: 0,
        proposals: [],
      });
    });

    it("should return correct response schema shape", async () => {
      const res = await app.request(
        `/proposals-activity?address=${VALID_ADDRESS}`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        address: VALID_ADDRESS,
        totalProposals: 0,
        votedProposals: 0,
        neverVoted: true,
        winRate: 0,
        yesRate: 0,
        avgTimeBeforeEnd: 0,
        proposals: [],
      });
    });

    it("should accept userVoteFilter parameter", async () => {
      const res = await app.request(
        `/proposals-activity?address=${VALID_ADDRESS}&userVoteFilter=yes`,
      );

      expect(res.status).toBe(200);
    });
  });
});
