import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
  beforeEach,
  vi,
} from "vitest";

import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import {
  accountPower,
  proposalsOnchain,
  votesOnchain,
} from "@/database/schema";
import { DrizzleRepository } from "@/repositories/drizzle";
import { governanceActivity } from "./controller";

const CURRENT_TIME = 1700000000;
const RECENT_TS = BigInt(CURRENT_TIME - 1000); // Some minutes before current time
const OLD_TS = BigInt(CURRENT_TIME - 90 * 86400 - 1000); // ~90 days before current time

type ProposalInsert = typeof proposalsOnchain.$inferInsert;

const createProposal = (
  overrides: Partial<ProposalInsert> = {},
): ProposalInsert => ({
  id: "prop-1",
  txHash: "0xabc",
  daoId: "TEST",
  proposerAccountId: "0x1111111111111111111111111111111111111111",
  targets: [],
  values: [],
  signatures: [],
  calldatas: [],
  startBlock: 1,
  endBlock: 100,
  title: "Test proposal",
  description: "Test proposal",
  timestamp: RECENT_TS,
  endTimestamp: BigInt(CURRENT_TIME + 10000),
  status: "ACTIVE",
  forVotes: 0n,
  againstVotes: 0n,
  abstainVotes: 0n,
  ...overrides,
});

describe("GovernanceActivity Controller", () => {
  let client: PGlite;
  let db: Drizzle;
  let erc20App: Hono;
  let erc721App: Hono;

  beforeAll(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(CURRENT_TIME * 1000);

    client = new PGlite();
    db = drizzle(client, { schema });

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();

    const repo = new DrizzleRepository(db);

    erc20App = new Hono();
    governanceActivity(erc20App, repo, "ERC20");

    erc721App = new Hono();
    governanceActivity(erc721App, repo, "ERC721");
  });

  afterAll(async () => {
    await client.close();
    vi.useRealTimers();
  });

  beforeEach(async () => {
    await db.delete(votesOnchain);
    await db.delete(proposalsOnchain);
    await db.delete(accountPower);
  });

  describe("GET /active-supply/compare", () => {
    it("should return 200 with activeSupply='0' when no data exists", async () => {
      const res = await erc20App.request("/active-supply/compare?days=90d");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ activeSupply: "0" });
    });

    it("should return 200 with activeSupply when recent voters exist", async () => {
      await db.insert(accountPower).values({
        id: "test-id-1",
        accountId: "0x1111111111111111111111111111111111111111",
        daoId: "TEST",
        votingPower: 1000000000000000000n,
        lastVoteTimestamp: RECENT_TS,
      });

      const res = await erc20App.request("/active-supply/compare?days=90d");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ activeSupply: "1000000000000000000" });
    });

    it("should return 400 for invalid days param", async () => {
      const res = await erc20App.request("/active-supply/compare?days=invalid");

      expect(res.status).toBe(400);
    });

    it("should use default days=90d when not provided", async () => {
      await db.insert(accountPower).values({
        id: "test-id-2",
        accountId: "0x1111111111111111111111111111111111111111",
        daoId: "TEST",
        votingPower: 500n,
        lastVoteTimestamp: RECENT_TS,
      });

      const res = await erc20App.request("/active-supply/compare");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ activeSupply: "500" });
    });
  });

  describe("GET /proposals/compare", () => {
    it("should return 200 with zeros when no data", async () => {
      const res = await erc20App.request("/proposals/compare?days=90d");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        currentProposalsLaunched: 0,
        oldProposalsLaunched: 0,
        changeRate: 0,
      });
    });

    it("should return 200 with data and calculated changeRate", async () => {
      const proposals: ProposalInsert[] = [];
      for (let i = 0; i < 10; i++) {
        proposals.push(
          createProposal({ id: `current-${i}`, timestamp: RECENT_TS }),
        );
      }
      for (let i = 0; i < 5; i++) {
        proposals.push(createProposal({ id: `old-${i}`, timestamp: OLD_TS }));
      }
      await db.insert(proposalsOnchain).values(proposals);

      const res = await erc20App.request("/proposals/compare?days=90d");

      expect(res.status).toBe(200);
      const body = await res.json();
      // currentProposalsLaunched = 15 (all proposals)
      // oldProposalsLaunched = 5
      // changeRate = 15/5 - 1 = 2
      expect(body).toEqual({
        currentProposalsLaunched: 15,
        oldProposalsLaunched: 5,
        changeRate: 2,
      });
    });

    it("should return changeRate=0 when oldProposalsLaunched is 0", async () => {
      await db
        .insert(proposalsOnchain)
        .values(createProposal({ timestamp: RECENT_TS }));

      const res = await erc20App.request("/proposals/compare?days=90d");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        currentProposalsLaunched: 1,
        oldProposalsLaunched: 0,
        changeRate: 0,
      });
    });
  });

  describe("GET /votes/compare", () => {
    it("should return 200 with zeros when no data", async () => {
      const res = await erc20App.request("/votes/compare?days=90d");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ currentVotes: 0, oldVotes: 0, changeRate: 0 });
    });

    it("should return 200 with data and calculated changeRate", async () => {
      await db.insert(votesOnchain).values([
        {
          id: "vote-1",
          txHash: "0xv1",
          daoId: "TEST",
          voterAccountId: "0x1111111111111111111111111111111111111111",
          proposalId: "p1",
          support: "FOR",
          votingPower: 1000n,
          timestamp: RECENT_TS,
        },
        {
          id: "vote-2",
          txHash: "0xv2",
          daoId: "TEST",
          voterAccountId: "0x2222222222222222222222222222222222222222",
          proposalId: "p1",
          support: "AGAINST",
          votingPower: 500n,
          timestamp: RECENT_TS,
        },
        {
          id: "vote-3",
          txHash: "0xv3",
          daoId: "TEST",
          voterAccountId: "0x3333333333333333333333333333333333333333",
          proposalId: "p2",
          support: "FOR",
          votingPower: 300n,
          timestamp: OLD_TS,
        },
      ]);

      const res = await erc20App.request("/votes/compare?days=90d");

      expect(res.status).toBe(200);
      const body = await res.json();
      // currentVotes = 3 (all), oldVotes = 1
      // changeRate = 3/1 - 1 = 2
      expect(body).toEqual({ currentVotes: 3, oldVotes: 1, changeRate: 2 });
    });
  });

  describe("GET /average-turnout/compare (ERC20)", () => {
    it("should return 200 with zeros when no data", async () => {
      const res = await erc20App.request("/average-turnout/compare?days=90d");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        currentAverageTurnout: expect.anything(),
        oldAverageTurnout: expect.anything(),
        changeRate: 0,
      });
    });

    it("should return 200 with ERC20 formatted values and changeRate", async () => {
      await db.insert(proposalsOnchain).values([
        createProposal({
          id: "current-1",
          timestamp: RECENT_TS,
          status: "SUCCEEDED",
          forVotes: 2000000000000000000n,
          againstVotes: 1000000000000000000n,
          abstainVotes: 500000000000000000n,
        }),
        createProposal({
          id: "old-1",
          timestamp: OLD_TS,
          status: "SUCCEEDED",
          forVotes: 1000000000000000000n,
          againstVotes: 500000000000000000n,
          abstainVotes: 250000000000000000n,
        }),
      ]);

      const res = await erc20App.request("/average-turnout/compare?days=90d");

      expect(res.status).toBe(200);
      const body = await res.json();
      // current: AVG(3.5e18) = 3.5e18
      // old: AVG(1.75e18) = 1.75e18
      // changeRate = 3.5 / 1.75 - 1 = 1
      expect(body).toEqual({
        currentAverageTurnout: "3500000000000000000",
        oldAverageTurnout: "1750000000000000000",
        changeRate: 1,
      });
    });

    it("should exclude CANCELED proposals from average turnout", async () => {
      await db.insert(proposalsOnchain).values([
        createProposal({
          id: "succeeded-1",
          timestamp: RECENT_TS,
          status: "SUCCEEDED",
          forVotes: 100n,
          againstVotes: 50n,
          abstainVotes: 25n,
        }),
        createProposal({
          id: "canceled-1",
          timestamp: RECENT_TS,
          status: "CANCELED",
          forVotes: 999999n,
          againstVotes: 999999n,
          abstainVotes: 999999n,
        }),
      ]);

      const res = await erc20App.request("/average-turnout/compare?days=90d");

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only SUCCEEDED counted: AVG(100 + 50 + 25) = 175
      expect(body).toEqual({
        currentAverageTurnout: "175.0000000000000000",
        oldAverageTurnout: "0",
        changeRate: 0,
      });
    });
  });

  describe("GET /average-turnout/compare (ERC721)", () => {
    it("should use split('.')[0] for values with ERC721 tokenType", async () => {
      await db.insert(proposalsOnchain).values([
        createProposal({
          id: "current-1",
          timestamp: RECENT_TS,
          status: "SUCCEEDED",
          forVotes: 30n,
          againstVotes: 10n,
          abstainVotes: 5n,
        }),
        createProposal({
          id: "old-1",
          timestamp: OLD_TS,
          status: "SUCCEEDED",
          forVotes: 15n,
          againstVotes: 5n,
          abstainVotes: 2n,
        }),
      ]);

      const res = await erc721App.request("/average-turnout/compare?days=90d");

      expect(res.status).toBe(200);
      const body = await res.json();
      // current: AVG(30 + 10 + 5) = 45 → "45"
      // old: AVG(15 + 5 + 2) = 22 → "22"
      expect(body).toEqual({
        currentAverageTurnout: "45",
        oldAverageTurnout: "22",
        changeRate: 45 / 22 - 1,
      });
    });
  });
});
