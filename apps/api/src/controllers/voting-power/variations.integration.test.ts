import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { getAddress } from "viem";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { votingPowerHistory, accountPower } from "@/database/schema";
import { VotingPowerRepository } from "@/repositories/voting-power/general";
import { VotingPowerService } from "@/services/voting-power";
import { votingPowerVariations } from "./variations";

type VotingPowerHistoryInsert = typeof votingPowerHistory.$inferInsert;
type AccountPowerInsert = typeof accountPower.$inferInsert;

const VALID_ADDRESS = getAddress("0x1234567890123456789012345678901234567890");
const SECOND_ADDRESS = getAddress("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
const DAO_ID = "test-dao";

const TX_1 =
  "0xabc1000000000000000000000000000000000000000000000000000000000001";
const TX_2 =
  "0xabc1000000000000000000000000000000000000000000000000000000000002";
const TX_3 =
  "0xabc1000000000000000000000000000000000000000000000000000000000003";
const TX_4 =
  "0xabc1000000000000000000000000000000000000000000000000000000000004";

const createHistoryRow = (
  overrides: Partial<VotingPowerHistoryInsert> = {},
): VotingPowerHistoryInsert => ({
  id: "test-id",
  transactionHash:
    "0xabc1230000000000000000000000000000000000000000000000000000000000",
  daoId: DAO_ID,
  accountId: VALID_ADDRESS,
  votingPower: 1200000000000000000n,
  delta: 200000000000000000n,
  deltaMod: 200000000000000000n,
  timestamp: 1700000000n,
  logIndex: 0,
  ...overrides,
});

const createAccountPowerRow = (
  overrides: Partial<AccountPowerInsert> = {},
): AccountPowerInsert => ({
  id: "test-id",
  accountId: VALID_ADDRESS,
  daoId: DAO_ID,
  votingPower: 1200000000000000000n,
  votesCount: 0,
  proposalsCount: 0,
  delegationsCount: 0,
  lastVoteTimestamp: 0n,
  ...overrides,
});

const VARIATION_PERIOD = {
  startTimestamp: "2023-11-14T22:13:20.000Z",
  endTimestamp: "2023-11-26T12:00:00.000Z",
};

// Period for fromDate=1699000000&toDate=1701000000
const VARIATION_PERIOD_2 = {
  startTimestamp: new Date(1699000000 * 1000).toISOString(),
  endTimestamp: new Date(1701000000 * 1000).toISOString(),
};

const VP_VARIATION_DATA = {
  accountId: VALID_ADDRESS,
  previousVotingPower: "1200000000000000000",
  currentVotingPower: "1200000000000000000",
  absoluteChange: "0",
  percentageChange: "0.00",
};

let client: PGlite;
let db: Drizzle;
let app: Hono;

beforeAll(async () => {
  client = new PGlite();
  db = drizzle(client, { schema });
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { apply } = await pushSchema(schema, db as any);
  await apply();

  const repo = new VotingPowerRepository(db);
  const service = new VotingPowerService(repo, repo);
  app = new Hono();
  votingPowerVariations(app, service);
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await db.delete(votingPowerHistory);
  await db.delete(accountPower);
});

describe("Voting Power Variations Controller", () => {
  describe("GET /accounts/voting-powers/variations", () => {
    it("should return 200 with variations data", async () => {
      await db
        .insert(votingPowerHistory)
        .values(createHistoryRow({ timestamp: 1700000000n }));

      const res = await app.request(
        "/accounts/voting-powers/variations?fromDate=1700000000&toDate=1701000000",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        period: {
          startTimestamp: "2023-11-14T22:13:20.000Z",
          endTimestamp: "2023-11-26T12:00:00.000Z",
        },
        items: [
          {
            accountId: VALID_ADDRESS,
            previousVotingPower: "1200000000000000000",
            currentVotingPower: "1200000000000000000",
            absoluteChange: "0",
            percentageChange: "0.000000000000000000000000000000000000",
          },
        ],
      });
    });

    it("should return 200 with empty items when no data", async () => {
      const res = await app.request("/accounts/voting-powers/variations");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        period: {
          startTimestamp: "UNBOUND",
          endTimestamp: "UNBOUND",
        },
        items: [],
      });
    });

    it("should accept pagination parameters", async () => {
      // Each account needs 2 rows: one at/before fromDate (previous VP) and one within range (current VP)
      await db.insert(votingPowerHistory).values([
        createHistoryRow({
          transactionHash: TX_1,
          accountId: VALID_ADDRESS,
          timestamp: 1699000000n,
          votingPower: 1000n,
          logIndex: 0,
        }),
        createHistoryRow({
          transactionHash: TX_2,
          accountId: VALID_ADDRESS,
          timestamp: 1700500000n,
          votingPower: 1200n,
          logIndex: 0,
        }),
        createHistoryRow({
          transactionHash: TX_3,
          accountId: SECOND_ADDRESS,
          timestamp: 1699000000n,
          votingPower: 1000n,
          logIndex: 0,
        }),
        createHistoryRow({
          transactionHash: TX_4,
          accountId: SECOND_ADDRESS,
          timestamp: 1700500000n,
          votingPower: 1100n,
          logIndex: 0,
        }),
      ]);

      const res = await app.request(
        "/accounts/voting-powers/variations?skip=0&limit=1&fromDate=1699000000&toDate=1701000000",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // limit=1 returns only 1 item; desc by absoluteChange: VALID (change=200) first
      expect(body).toEqual({
        items: [
          {
            accountId: VALID_ADDRESS,
            previousVotingPower: "1000",
            currentVotingPower: "1200",
            absoluteChange: "200",
            percentageChange: "20.00000000000000000000",
          },
        ],
        period: VARIATION_PERIOD_2,
      });
    });

    it("should accept addresses filter", async () => {
      await db.insert(votingPowerHistory).values([
        createHistoryRow({
          transactionHash: TX_1,
          accountId: VALID_ADDRESS,
          timestamp: 1699000000n,
          votingPower: 1000n,
          logIndex: 0,
        }),
        createHistoryRow({
          transactionHash: TX_2,
          accountId: VALID_ADDRESS,
          timestamp: 1700500000n,
          votingPower: 1200n,
          logIndex: 0,
        }),
        createHistoryRow({
          transactionHash: TX_3,
          accountId: SECOND_ADDRESS,
          timestamp: 1699000000n,
          votingPower: 1000n,
          logIndex: 0,
        }),
        createHistoryRow({
          transactionHash: TX_4,
          accountId: SECOND_ADDRESS,
          timestamp: 1700500000n,
          votingPower: 1100n,
          logIndex: 0,
        }),
      ]);

      const res = await app.request(
        `/accounts/voting-powers/variations?addresses=${VALID_ADDRESS}&fromDate=1699000000&toDate=1701000000`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only VALID_ADDRESS is returned due to addresses filter
      expect(body).toEqual({
        items: [
          {
            accountId: VALID_ADDRESS,
            previousVotingPower: "1000",
            currentVotingPower: "1200",
            absoluteChange: "200",
            percentageChange: "20.00000000000000000000",
          },
        ],
        period: VARIATION_PERIOD_2,
      });
    });

    it("should accept fromDate and toDate parameters", async () => {
      // VALID_ADDRESS has rows within the date range (produces a variation)
      // SECOND_ADDRESS only has a row after toDate (won't appear in results)
      await db.insert(votingPowerHistory).values([
        createHistoryRow({
          transactionHash: TX_1,
          accountId: VALID_ADDRESS,
          timestamp: 1699000000n,
          votingPower: 1000n,
          logIndex: 0,
        }),
        createHistoryRow({
          transactionHash: TX_2,
          accountId: VALID_ADDRESS,
          timestamp: 1700500000n,
          votingPower: 1200n,
          logIndex: 0,
        }),
        // SECOND_ADDRESS only has a row after toDate=1701000000
        createHistoryRow({
          transactionHash: TX_3,
          accountId: SECOND_ADDRESS,
          timestamp: 1705000000n,
          votingPower: 500n,
          logIndex: 0,
        }),
      ]);

      const res = await app.request(
        "/accounts/voting-powers/variations?fromDate=1699000000&toDate=1701000000",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only VALID_ADDRESS appears; SECOND_ADDRESS has no rows within the date range
      expect(body).toEqual({
        items: [
          {
            accountId: VALID_ADDRESS,
            previousVotingPower: "1000",
            currentVotingPower: "1200",
            absoluteChange: "200",
            percentageChange: "20.00000000000000000000",
          },
        ],
        period: VARIATION_PERIOD_2,
      });
    });

    it("should accept orderDirection parameter", async () => {
      // VALID_ADDRESS: change = 200 (1000→1200), SECOND_ADDRESS: change = 100 (1000→1100)
      await db.insert(votingPowerHistory).values([
        createHistoryRow({
          transactionHash: TX_1,
          accountId: VALID_ADDRESS,
          timestamp: 1699000000n,
          votingPower: 1000n,
          logIndex: 0,
        }),
        createHistoryRow({
          transactionHash: TX_2,
          accountId: VALID_ADDRESS,
          timestamp: 1700500000n,
          votingPower: 1200n,
          logIndex: 0,
        }),
        createHistoryRow({
          transactionHash: TX_3,
          accountId: SECOND_ADDRESS,
          timestamp: 1699000000n,
          votingPower: 1000n,
          logIndex: 0,
        }),
        createHistoryRow({
          transactionHash: TX_4,
          accountId: SECOND_ADDRESS,
          timestamp: 1700500000n,
          votingPower: 1100n,
          logIndex: 0,
        }),
      ]);

      const res = await app.request(
        "/accounts/voting-powers/variations?orderDirection=asc&fromDate=1699000000&toDate=1701000000",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // asc by ABS(absoluteChange): SECOND_ADDRESS (change=100) first, VALID_ADDRESS (change=200) second
      expect(body).toEqual({
        items: [
          {
            accountId: SECOND_ADDRESS,
            previousVotingPower: "1000",
            currentVotingPower: "1100",
            absoluteChange: "100",
            percentageChange: "10.00000000000000000000",
          },
          {
            accountId: VALID_ADDRESS,
            previousVotingPower: "1000",
            currentVotingPower: "1200",
            absoluteChange: "200",
            percentageChange: "20.00000000000000000000",
          },
        ],
        period: VARIATION_PERIOD_2,
      });
    });
  });

  describe("GET /accounts/{address}/voting-powers/variations", () => {
    it("should return 200 with single account variation", async () => {
      await db.insert(accountPower).values(createAccountPowerRow());

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/voting-powers/variations?fromDate=1700000000&toDate=1701000000`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        period: VARIATION_PERIOD,
        data: VP_VARIATION_DATA,
      });
    });

    it("should return 400 for invalid address", async () => {
      const res = await app.request(
        "/accounts/not-valid/voting-powers/variations",
      );

      expect(res.status).toBe(400);
    });

    it("should return zero change when no history exists for account", async () => {
      await db.insert(accountPower).values(createAccountPowerRow());

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/voting-powers/variations`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        period: {
          startTimestamp: "UNBOUND",
          endTimestamp: "UNBOUND",
        },
        data: VP_VARIATION_DATA,
      });
    });
  });
});
