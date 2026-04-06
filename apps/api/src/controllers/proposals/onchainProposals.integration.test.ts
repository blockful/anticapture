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
import { DrizzleRepository } from "@/repositories/drizzle";
import { ProposalsService } from "@/services";

import { proposals } from "./onchainProposals";

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

let client: PGlite;
let db: Drizzle;
let app: Hono;
let fakeClient: FakeDAOClient;

type ProposalInsert = typeof proposalsOnchain.$inferInsert;

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
  status: "PENDING",
  forVotes: 5000n,
  againstVotes: 1000n,
  abstainVotes: 500n,
  proposalType: null,
  ...overrides,
});

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
  const repo = new DrizzleRepository(db);
  const service = new ProposalsService(repo, fakeClient);
  app = new Hono();
  proposals(app, service, fakeClient, 12);
});

const BASE_PROPOSAL_FIELDS = {
  daoId: "ENS",
  proposerAccountId: getAddress("0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa"),
  title: "Test Proposal",
  description: "A test proposal description",
  startBlock: 10,
  endBlock: 110,
  endTimestamp: 1700100000,
  startTimestamp: 1700098800,
  status: "ACTIVE",
  forVotes: "5000",
  againstVotes: "1000",
  abstainVotes: "500",
  quorum: "1000",
  calldatas: ["0x"],
  values: ["0"],
  targets: ["0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB"],
  proposalType: null,
};

describe("Onchain Proposals Controller", () => {
  describe("GET /proposals", () => {
    it("should return 200 with proposals and totalCount", async () => {
      await db.insert(proposalsOnchain).values(createProposal());

      const res = await app.request("/proposals");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        totalCount: 1,
        items: [
          {
            ...BASE_PROPOSAL_FIELDS,
            id: "1",
            txHash: "0xabc123",
            timestamp: 1700000000,
          },
        ],
      });
    });

    it("should return 200 with empty items when no proposals", async () => {
      const res = await app.request("/proposals");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [], totalCount: 0 });
    });

    it("should accept pagination parameters", async () => {
      await db.insert(proposalsOnchain).values(createProposal());

      const res = await app.request("/proposals?skip=0&limit=10");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        totalCount: 1,
        items: [
          {
            ...BASE_PROPOSAL_FIELDS,
            id: "1",
            txHash: "0xabc123",
            timestamp: 1700000000,
          },
        ],
      });
    });

    it("should accept orderDirection parameter", async () => {
      await db.insert(proposalsOnchain).values([
        createProposal({ id: "1", timestamp: 1700000000n }),
        createProposal({
          id: "2",
          timestamp: 1700001000n,
          txHash: "0xdef456",
        }),
      ]);

      const res = await app.request("/proposals?orderDirection=asc");

      expect(res.status).toBe(200);
      const body = await res.json();
      // asc by timestamp: older proposal first
      expect(body).toEqual({
        totalCount: 2,
        items: [
          {
            ...BASE_PROPOSAL_FIELDS,
            id: "1",
            txHash: "0xabc123",
            timestamp: 1700000000,
          },
          {
            ...BASE_PROPOSAL_FIELDS,
            id: "2",
            txHash: "0xdef456",
            timestamp: 1700001000,
          },
        ],
      });
    });

    it("should accept fromDate parameter", async () => {
      await db.insert(proposalsOnchain).values([
        createProposal({ id: "1", timestamp: 1698000000n }),
        createProposal({
          id: "2",
          timestamp: 1700500000n,
          txHash: "0xdef456",
        }),
      ]);

      const res = await app.request("/proposals?fromDate=1700000000");

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only proposal with timestamp >= 1700000000 is returned
      expect(body).toEqual({
        items: [
          {
            ...BASE_PROPOSAL_FIELDS,
            id: "2",
            txHash: "0xdef456",
            timestamp: 1700500000,
          },
        ],
        totalCount: 2,
      });
    });

    it("should return partial matches for title or id", async () => {
      await db.insert(proposalsOnchain).values([
        createProposal({
          id: "prop-ens-1",
          title: "Treasury Upgrade",
          txHash: "0x111",
          timestamp: 1700000000n,
        }),
        createProposal({
          id: "42-special",
          title: "Operations Budget",
          txHash: "0x222",
          timestamp: 1700001000n,
        }),
        createProposal({
          id: "other-proposal",
          title: "Community Call",
          txHash: "0x333",
          timestamp: 1700002000n,
        }),
      ]);

      const byTitleRes = await app.request("/proposals/search?query=grade");

      expect(byTitleRes.status).toBe(200);
      expect(await byTitleRes.json()).toEqual({
        totalCount: 1,
        items: [
          {
            ...BASE_PROPOSAL_FIELDS,
            id: "prop-ens-1",
            title: "Treasury Upgrade",
            txHash: "0x111",
            timestamp: 1700000000,
          },
        ],
      });

      const byIdRes = await app.request("/proposals/search?query=special");

      expect(byIdRes.status).toBe(200);
      expect(await byIdRes.json()).toEqual({
        totalCount: 1,
        items: [
          {
            ...BASE_PROPOSAL_FIELDS,
            id: "42-special",
            title: "Operations Budget",
            txHash: "0x222",
            timestamp: 1700001000,
          },
        ],
      });
    });

    it("should treat % and _ as literal characters in search queries", async () => {
      await db.insert(proposalsOnchain).values([
        createProposal({
          id: "proposal_100",
          title: "Budget 100% Plan",
          txHash: "0x444",
          timestamp: 1700000000n,
        }),
        createProposal({
          id: "proposal-plain",
          title: "Ordinary Proposal",
          txHash: "0x555",
          timestamp: 1700001000n,
        }),
      ]);

      const percentRes = await app.request("/proposals/search?query=%25");

      expect(percentRes.status).toBe(200);
      expect(await percentRes.json()).toEqual({
        totalCount: 1,
        items: [
          {
            ...BASE_PROPOSAL_FIELDS,
            id: "proposal_100",
            title: "Budget 100% Plan",
            txHash: "0x444",
            timestamp: 1700000000,
          },
        ],
      });

      const underscoreRes = await app.request("/proposals/search?query=_");

      expect(underscoreRes.status).toBe(200);
      expect(await underscoreRes.json()).toEqual({
        totalCount: 1,
        items: [
          {
            ...BASE_PROPOSAL_FIELDS,
            id: "proposal_100",
            title: "Budget 100% Plan",
            txHash: "0x444",
            timestamp: 1700000000,
          },
        ],
      });
    });
  });

  describe("GET /proposals/{id}", () => {
    it("should return 200 with a single proposal", async () => {
      await db.insert(proposalsOnchain).values(createProposal({ id: "42" }));

      const res = await app.request("/proposals/42");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        ...BASE_PROPOSAL_FIELDS,
        id: "42",
        txHash: "0xabc123",
        timestamp: 1700000000,
      });
    });

    it("should return 404 when proposal not found", async () => {
      const res = await app.request("/proposals/999");

      expect(res.status).toBe(404);
    });
  });
});
