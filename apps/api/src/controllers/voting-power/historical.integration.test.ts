import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { getAddress } from "viem";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { votingPowerHistory, delegation, transfer } from "@/database/schema";
import { VotingPowerRepository } from "@/repositories/voting-power/general";
import { VotingPowerService } from "@/services/voting-power";
import { historicalVotingPower } from "./historical";

type VotingPowerHistoryInsert = typeof votingPowerHistory.$inferInsert;
type DelegationInsert = typeof delegation.$inferInsert;

const VALID_ADDRESS = getAddress("0x1234567890123456789012345678901234567890");
const DELEGATE_ADDRESS = getAddress(
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
);
const TX_HASH =
  "0xabc1230000000000000000000000000000000000000000000000000000000000";
const TX_HASH_1 =
  "0xabc1230000000000000000000000000000000000000000000000000000000001";
const TX_HASH_2 =
  "0xabc1230000000000000000000000000000000000000000000000000000000002";
const DAO_ID = "ENS";

const createHistoryRow = (
  overrides: Partial<VotingPowerHistoryInsert> = {},
): VotingPowerHistoryInsert => ({
  id: "test-id",
  transactionHash: TX_HASH,
  daoId: DAO_ID,
  accountId: VALID_ADDRESS,
  votingPower: 1000000000000000000n,
  delta: 500000000000000000n,
  deltaMod: 500000000000000000n,
  timestamp: 1700000000n,
  logIndex: 1,
  ...overrides,
});

const createDelegationRow = (
  overrides: Partial<DelegationInsert> = {},
): DelegationInsert => ({
  id: "test-id",
  transactionHash: TX_HASH,
  daoId: DAO_ID,
  delegateAccountId: VALID_ADDRESS,
  delegatorAccountId: DELEGATE_ADDRESS,
  delegatedValue: 500000000000000000n,
  previousDelegate: null,
  timestamp: 1700000000n,
  logIndex: 0,
  isCex: false,
  isDex: false,
  isLending: false,
  isTotal: false,
  ...overrides,
});

const VP_HISTORY_ITEM = {
  transactionHash: TX_HASH,
  daoId: DAO_ID,
  accountId: VALID_ADDRESS,
  votingPower: "1000000000000000000",
  delta: "500000000000000000",
  timestamp: "1700000000",
  logIndex: 1,
  delegation: null,
  transfer: null,
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
  historicalVotingPower(app, service);
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await db.delete(votingPowerHistory);
  await db.delete(delegation);
  await db.delete(transfer);
});

describe("Historical Voting Power Controller", () => {
  describe("GET /accounts/{address}/voting-powers/historical", () => {
    it("should return 200 with historical voting power data", async () => {
      await db.insert(votingPowerHistory).values(createHistoryRow());

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/voting-powers/historical`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        totalCount: 1,
        items: [VP_HISTORY_ITEM],
      });
    });

    it("should return 200 with empty items when no data", async () => {
      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/voting-powers/historical`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [], totalCount: 0 });
    });

    it("should accept pagination parameters", async () => {
      await db.insert(votingPowerHistory).values(createHistoryRow());

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/voting-powers/historical?skip=0&limit=10`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [VP_HISTORY_ITEM], totalCount: 1 });
    });

    it("should accept orderBy=delta", async () => {
      await db.insert(votingPowerHistory).values([
        createHistoryRow({
          transactionHash: TX_HASH_1,
          delta: 100n,
          deltaMod: 100n,
          logIndex: 0,
        }),
        createHistoryRow({
          transactionHash: TX_HASH_2,
          delta: 500n,
          deltaMod: 500n,
          logIndex: 0,
        }),
      ]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/voting-powers/historical?orderBy=delta&orderDirection=desc`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // desc by deltaMod: larger delta first
      expect(body).toEqual({
        totalCount: 2,
        items: [
          {
            transactionHash: TX_HASH_2,
            daoId: DAO_ID,
            accountId: VALID_ADDRESS,
            votingPower: "1000000000000000000",
            delta: "500",
            timestamp: "1700000000",
            logIndex: 0,
            delegation: null,
            transfer: null,
          },
          {
            transactionHash: TX_HASH_1,
            daoId: DAO_ID,
            accountId: VALID_ADDRESS,
            votingPower: "1000000000000000000",
            delta: "100",
            timestamp: "1700000000",
            logIndex: 0,
            delegation: null,
            transfer: null,
          },
        ],
      });
    });

    it("should accept fromValue and toValue parameters", async () => {
      // deltaMod=100n within [50, 200], deltaMod=10000n outside range
      await db.insert(votingPowerHistory).values([
        createHistoryRow({
          transactionHash: TX_HASH_1,
          deltaMod: 100n,
          logIndex: 0,
        }),
        createHistoryRow({
          transactionHash: TX_HASH_2,
          deltaMod: 10000n,
          logIndex: 0,
        }),
      ]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/voting-powers/historical?fromValue=50&toValue=200`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only the row with deltaMod=100 is within [50, 200]
      expect(body).toEqual({
        items: [
          {
            transactionHash: TX_HASH_1,
            daoId: DAO_ID,
            accountId: VALID_ADDRESS,
            votingPower: "1000000000000000000",
            delta: "500000000000000000",
            timestamp: "1700000000",
            logIndex: 0,
            delegation: null,
            transfer: null,
          },
        ],
        totalCount: 1,
      });
    });

    it("should accept fromDate and toDate parameters", async () => {
      // timestamp=1700000000 is within [1699000000, 1701000000], timestamp=1695000000 is not
      await db.insert(votingPowerHistory).values([
        createHistoryRow({
          transactionHash: TX_HASH_1,
          timestamp: 1700000000n,
          logIndex: 0,
        }),
        createHistoryRow({
          transactionHash: TX_HASH_2,
          timestamp: 1695000000n,
          logIndex: 0,
        }),
      ]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/voting-powers/historical?fromDate=1699000000&toDate=1701000000`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only the row with timestamp=1700000000 is within the range
      expect(body).toEqual({
        items: [
          {
            transactionHash: TX_HASH_1,
            daoId: DAO_ID,
            accountId: VALID_ADDRESS,
            votingPower: "1000000000000000000",
            delta: "500000000000000000",
            timestamp: "1700000000",
            logIndex: 0,
            delegation: null,
            transfer: null,
          },
        ],
        totalCount: 1,
      });
    });

    it("should return 400 for invalid address", async () => {
      const res = await app.request(
        "/accounts/not-valid/voting-powers/historical",
      );

      expect(res.status).toBe(400);
    });

    it("should include delegation data when present", async () => {
      // Insert delegation at logIndex=0, votingPowerHistory at logIndex=1
      // so the LEFT JOIN condition (logIndex < votingPowerHistory.logIndex) matches
      await db.insert(delegation).values(createDelegationRow({ logIndex: 0 }));
      await db
        .insert(votingPowerHistory)
        .values(createHistoryRow({ logIndex: 1 }));

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/voting-powers/historical`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        totalCount: 1,
        items: [
          {
            transactionHash: TX_HASH,
            daoId: DAO_ID,
            accountId: VALID_ADDRESS,
            votingPower: "1000000000000000000",
            delta: "500000000000000000",
            timestamp: "1700000000",
            logIndex: 1,
            delegation: {
              from: DELEGATE_ADDRESS,
              value: "500000000000000000",
              to: VALID_ADDRESS,
              previousDelegate: null,
            },
            transfer: null,
          },
        ],
      });
    });
  });

  describe("GET /voting-powers/historical", () => {
    it("should return 200 with historical data", async () => {
      await db.insert(votingPowerHistory).values(createHistoryRow());

      const res = await app.request("/voting-powers/historical");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [VP_HISTORY_ITEM],
        totalCount: 1,
      });
    });
  });
});
