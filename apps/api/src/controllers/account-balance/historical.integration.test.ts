import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { getAddress } from "viem";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { balanceHistory, transfer } from "@/database/schema";
import { HistoricalBalanceRepository } from "@/repositories/account-balance/historical";
import { HistoricalBalancesService } from "@/services/account-balance/historical";
import { historicalBalances } from "./historical";

type BalanceHistoryInsert = typeof balanceHistory.$inferInsert;
type TransferInsert = typeof transfer.$inferInsert;

const VALID_ADDRESS = getAddress("0x1234567890123456789012345678901234567890");
const FROM_ADDRESS = getAddress("0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa");
const TOKEN_ID = getAddress("0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72");
const TX_HASH =
  "0xabc1230000000000000000000000000000000000000000000000000000000000";
const DAO_ID = "ENS";

const createHistoryRow = (
  overrides: Partial<BalanceHistoryInsert> = {},
): BalanceHistoryInsert => ({
  transactionHash: TX_HASH,
  daoId: DAO_ID,
  accountId: VALID_ADDRESS,
  balance: 1000000000000000000n,
  delta: 500000000000000000n,
  deltaMod: 500000000000000000n,
  timestamp: 1700000000n,
  logIndex: 0,
  ...overrides,
});

const createTransferRow = (
  overrides: Partial<TransferInsert> = {},
): TransferInsert => ({
  transactionHash: TX_HASH,
  daoId: DAO_ID,
  tokenId: TOKEN_ID,
  amount: 500000000000000000n,
  fromAccountId: FROM_ADDRESS,
  toAccountId: VALID_ADDRESS,
  timestamp: 1700000000n,
  logIndex: 0,
  isCex: false,
  isDex: false,
  isLending: false,
  isTotal: false,
  ...overrides,
});

const BALANCE_HISTORY_ITEM = {
  transactionHash: TX_HASH,
  daoId: DAO_ID,
  accountId: VALID_ADDRESS,
  balance: "1000000000000000000",
  delta: "500000000000000000",
  timestamp: "1700000000",
  logIndex: 0,
  transfer: {
    value: "500000000000000000",
    from: FROM_ADDRESS,
    to: VALID_ADDRESS,
  },
};
const TX_1 =
  "0xabc1230000000000000000000000000000000000000000000000000000000001";
const TX_2 =
  "0xabc1230000000000000000000000000000000000000000000000000000000002";

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

  const repo = new HistoricalBalanceRepository(db);
  const service = new HistoricalBalancesService(repo);
  app = new Hono();
  historicalBalances(app, service);
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await db.delete(balanceHistory);
  await db.delete(transfer);
});

describe("Historical Balances Controller", () => {
  describe("GET /accounts/{address}/balances/historical", () => {
    it("should return 200 with items and totalCount", async () => {
      await db.insert(balanceHistory).values(createHistoryRow());
      await db.insert(transfer).values(createTransferRow());

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/balances/historical`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        totalCount: 1,
        items: [BALANCE_HISTORY_ITEM],
      });
    });

    it("should return 200 with empty items when no data", async () => {
      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/balances/historical`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [], totalCount: 0 });
    });

    it("should accept pagination parameters", async () => {
      await db.insert(balanceHistory).values(createHistoryRow());
      await db.insert(transfer).values(createTransferRow());

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/balances/historical?skip=0&limit=10`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        totalCount: 1,
        items: [BALANCE_HISTORY_ITEM],
      });
    });

    it("should accept orderBy=delta", async () => {
      // Insert 2 rows with different delta/deltaMod values
      await db.insert(balanceHistory).values([
        createHistoryRow({
          transactionHash: TX_1,
          delta: 100n,
          deltaMod: 100n,
          logIndex: 0,
        }),
        createHistoryRow({
          transactionHash: TX_2,
          delta: 500n,
          deltaMod: 500n,
          logIndex: 0,
        }),
      ]);
      await db.insert(transfer).values([
        createTransferRow({ transactionHash: TX_1, logIndex: 0 }),
        createTransferRow({
          transactionHash: TX_2,
          logIndex: 0,
          amount: 500n,
        }),
      ]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/balances/historical?orderBy=delta&orderDirection=desc`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // desc by deltaMod: larger delta first
      expect(body).toEqual({
        totalCount: 2,
        items: [
          {
            transactionHash: TX_2,
            daoId: DAO_ID,
            accountId: VALID_ADDRESS,
            balance: "1000000000000000000",
            delta: "500",
            timestamp: "1700000000",
            logIndex: 0,
            transfer: { value: "500", from: FROM_ADDRESS, to: VALID_ADDRESS },
          },
          {
            transactionHash: TX_1,
            daoId: DAO_ID,
            accountId: VALID_ADDRESS,
            balance: "1000000000000000000",
            delta: "100",
            timestamp: "1700000000",
            logIndex: 0,
            transfer: {
              value: "500000000000000000",
              from: FROM_ADDRESS,
              to: VALID_ADDRESS,
            },
          },
        ],
      });
    });

    it("should accept orderDirection=asc", async () => {
      // Insert 2 rows with different timestamps
      await db.insert(balanceHistory).values([
        createHistoryRow({
          transactionHash: TX_1,
          timestamp: 1700000000n,
          logIndex: 0,
        }),
        createHistoryRow({
          transactionHash: TX_2,
          timestamp: 1700001000n,
          logIndex: 0,
        }),
      ]);
      await db
        .insert(transfer)
        .values([
          createTransferRow({ transactionHash: TX_1, logIndex: 0 }),
          createTransferRow({ transactionHash: TX_2, logIndex: 0 }),
        ]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/balances/historical?orderDirection=asc`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // asc by timestamp: earlier first
      expect(body).toEqual({
        totalCount: 2,
        items: [
          { ...BALANCE_HISTORY_ITEM, transactionHash: TX_1 },
          {
            ...BALANCE_HISTORY_ITEM,
            transactionHash: TX_2,
            timestamp: "1700001000",
          },
        ],
      });
    });

    it("should accept fromValue and toValue parameters", async () => {
      // deltaMod=100n is within range [50, 200], deltaMod=10000n is outside
      await db.insert(balanceHistory).values([
        createHistoryRow({
          transactionHash: TX_1,
          deltaMod: 100n,
          logIndex: 0,
        }),
        createHistoryRow({
          transactionHash: TX_2,
          deltaMod: 10000n,
          logIndex: 0,
        }),
      ]);
      await db
        .insert(transfer)
        .values([
          createTransferRow({ transactionHash: TX_1, logIndex: 0 }),
          createTransferRow({ transactionHash: TX_2, logIndex: 0 }),
        ]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/balances/historical?fromValue=50&toValue=200`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only the row with deltaMod=100 is within [50, 200]
      expect(body).toEqual({
        totalCount: 1,
        items: [{ ...BALANCE_HISTORY_ITEM, transactionHash: TX_1 }],
      });
    });

    it("should accept fromDate and toDate parameters", async () => {
      // timestamp=1700000000 is within [1699000000, 1701000000], timestamp=1695000000 is not
      await db.insert(balanceHistory).values([
        createHistoryRow({
          transactionHash: TX_1,
          timestamp: 1700000000n,
          logIndex: 0,
        }),
        createHistoryRow({
          transactionHash: TX_2,
          timestamp: 1695000000n,
          logIndex: 0,
        }),
      ]);
      await db.insert(transfer).values([
        createTransferRow({
          transactionHash: TX_1,
          timestamp: 1700000000n,
          logIndex: 0,
        }),
        createTransferRow({
          transactionHash: TX_2,
          timestamp: 1695000000n,
          logIndex: 0,
        }),
      ]);

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/balances/historical?fromDate=1699000000&toDate=1701000000`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only the row with timestamp=1700000000 is within the range
      expect(body).toEqual({
        totalCount: 1,
        items: [{ ...BALANCE_HISTORY_ITEM, transactionHash: TX_1 }],
      });
    });

    it("should return 400 for invalid address", async () => {
      const res = await app.request("/accounts/not-valid/balances/historical");

      expect(res.status).toBe(400);
    });
  });
});
