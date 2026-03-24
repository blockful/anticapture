import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { getAddress } from "viem";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { accountBalance, transfer } from "@/database/schema";
import { AccountInteractionsRepository } from "@/repositories/account-balance/interactions";
import { AccountInteractionsService } from "@/services/account-balance/interactions";
import { accountInteractions } from "./interactions";

type AccountBalanceInsert = typeof accountBalance.$inferInsert;
type TransferInsert = typeof transfer.$inferInsert;

const VALID_ADDRESS = getAddress("0x1234567890123456789012345678901234567890");
const COUNTERPART = getAddress("0xabcdefabcdefabcdefabcdefabcdefabcdefabcd");
const COUNTERPART_2 = getAddress("0x3333333333333333333333333333333333333333");
const TOKEN_ID = getAddress("0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72");
const TX_HASH =
  "0xabc1230000000000000000000000000000000000000000000000000000000000";
const DAO_ID = "ENS";

const createAccountBalanceRow = (
  overrides: Partial<AccountBalanceInsert> = {},
): AccountBalanceInsert => ({
  accountId: COUNTERPART,
  tokenId: TOKEN_ID,
  balance: 200000000000000000n,
  delegate: COUNTERPART,
  ...overrides,
});

const createTransferRow = (
  overrides: Partial<TransferInsert> = {},
): TransferInsert => ({
  transactionHash: TX_HASH,
  daoId: DAO_ID,
  tokenId: TOKEN_ID,
  amount: 100000000000000000n,
  fromAccountId: COUNTERPART,
  toAccountId: VALID_ADDRESS,
  timestamp: 1700000000n,
  logIndex: 0,
  isCex: false,
  isDex: false,
  isLending: false,
  isTotal: false,
  ...overrides,
});

const DATE_PERIOD = {
  startTimestamp: "2023-11-14T22:13:20.000Z",
  endTimestamp: "2023-11-26T12:00:00.000Z",
};

const EMPTY_INTERACTIONS_RESPONSE = {
  totalCount: 0,
  period: { startTimestamp: "UNBOUND", endTimestamp: "UNBOUND" },
  items: [],
};

const COUNTERPART_INTERACTION_ITEM = {
  accountId: COUNTERPART,
  amountTransferred: "-100000000000000000",
  totalVolume: "100000000000000000",
  transferCount: "1",
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

  const repo = new AccountInteractionsRepository(db);
  const service = new AccountInteractionsService(repo);
  app = new Hono();
  accountInteractions(app, service);
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await db.delete(transfer);
  await db.delete(accountBalance);
});

describe("Account Interactions Controller", () => {
  describe("GET /balances/{address}/interactions", () => {
    it("should return 200 with interaction data and period", async () => {
      await db.insert(accountBalance).values(createAccountBalanceRow());
      await db.insert(transfer).values(createTransferRow());

      const res = await app.request(
        `/balances/${VALID_ADDRESS}/interactions?fromDate=1700000000&toDate=1701000000`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        totalCount: 1,
        period: DATE_PERIOD,
        items: [COUNTERPART_INTERACTION_ITEM],
      });
    });

    it("should return 200 with empty items when no interactions", async () => {
      const res = await app.request(`/balances/${VALID_ADDRESS}/interactions`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(EMPTY_INTERACTIONS_RESPONSE);
    });

    it("should accept pagination parameters", async () => {
      await db.insert(accountBalance).values(createAccountBalanceRow());
      await db.insert(transfer).values(createTransferRow());

      const res = await app.request(
        `/balances/${VALID_ADDRESS}/interactions?skip=0&limit=10&fromDate=1700000000&toDate=1701000000`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        totalCount: 1,
        period: DATE_PERIOD,
        items: [COUNTERPART_INTERACTION_ITEM],
      });
    });

    it("should accept orderBy and orderDirection parameters", async () => {
      await db.insert(accountBalance).values([
        createAccountBalanceRow({ accountId: COUNTERPART, balance: 100n }),
        createAccountBalanceRow({
          accountId: COUNTERPART_2,
          balance: 200n,
          delegate: COUNTERPART,
        }),
      ]);
      await db.insert(transfer).values([
        createTransferRow({
          fromAccountId: COUNTERPART,
          toAccountId: VALID_ADDRESS,
          amount: 100n,
          logIndex: 0,
        }),
        createTransferRow({
          fromAccountId: COUNTERPART_2,
          toAccountId: VALID_ADDRESS,
          amount: 500n,
          logIndex: 1,
          transactionHash:
            "0xabc1230000000000000000000000000000000000000000000000000000000002",
        }),
      ]);

      const res = await app.request(
        `/balances/${VALID_ADDRESS}/interactions?orderBy=volume&orderDirection=asc&fromDate=1700000000&toDate=1701000000`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // asc by volume: COUNTERPART (volume=100) first, COUNTERPART_2 (volume=500) second
      expect(body).toEqual({
        totalCount: 2,
        period: {
          startTimestamp: "2023-11-14T22:13:20.000Z",
          endTimestamp: "2023-11-26T12:00:00.000Z",
        },
        items: [
          {
            accountId: COUNTERPART,
            amountTransferred: "-100",
            totalVolume: "100",
            transferCount: "1",
          },
          {
            accountId: COUNTERPART_2,
            amountTransferred: "-500",
            totalVolume: "500",
            transferCount: "1",
          },
        ],
      });
    });

    it("should accept filter parameters", async () => {
      await db.insert(accountBalance).values(createAccountBalanceRow());
      await db.insert(transfer).values(createTransferRow());

      const res = await app.request(
        `/balances/${VALID_ADDRESS}/interactions?filterAddress=${COUNTERPART}&fromDate=1700000000&toDate=1701000000`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only COUNTERPART's interaction should be returned
      expect(body).toEqual({
        totalCount: 1,
        period: DATE_PERIOD,
        items: [COUNTERPART_INTERACTION_ITEM],
      });
    });

    it("should return 400 for invalid address", async () => {
      const res = await app.request("/balances/not-valid/interactions");

      expect(res.status).toBe(400);
    });

    it("should include period timestamps as null when not provided", async () => {
      const res = await app.request(`/balances/${VALID_ADDRESS}/interactions`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual(EMPTY_INTERACTIONS_RESPONSE);
    });
  });
});
