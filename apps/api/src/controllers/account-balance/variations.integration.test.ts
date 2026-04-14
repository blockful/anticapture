import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { getAddress } from "viem";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { accountBalance, transfer } from "@/database/schema";
import { AccountBalanceQueryFragments } from "@/repositories/account-balance/common";
import { AccountBalanceRepository } from "@/repositories/account-balance/listing";
import { BalanceVariationsRepository } from "@/repositories/account-balance/variations";
import { BalanceVariationsService } from "@/services/account-balance/variations";
import { accountBalanceVariations } from "./variations";

type AccountBalanceInsert = typeof accountBalance.$inferInsert;
type TransferInsert = typeof transfer.$inferInsert;

const VALID_ADDRESS = getAddress("0x1234567890123456789012345678901234567890");
const SECOND_ADDRESS = getAddress("0x2222222222222222222222222222222222222222");
const DELEGATE_ADDRESS = getAddress(
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
);
const TOKEN_ID = getAddress("0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72");
const TX_HASH =
  "0xabc1230000000000000000000000000000000000000000000000000000000000";
const DAO_ID = "ENS";

const createAccountBalanceRow = (
  overrides: Partial<AccountBalanceInsert> = {},
): AccountBalanceInsert => ({
  id: "test-id",
  accountId: VALID_ADDRESS,
  tokenId: TOKEN_ID,
  balance: 1200000000000000000n,
  delegate: DELEGATE_ADDRESS,
  ...overrides,
});

const createTransferRow = (
  overrides: Partial<TransferInsert> = {},
): TransferInsert => ({
  id: "test-id",
  transactionHash: TX_HASH,
  daoId: DAO_ID,
  tokenId: TOKEN_ID,
  amount: 200000000000000000n,
  fromAccountId: DELEGATE_ADDRESS,
  toAccountId: VALID_ADDRESS,
  timestamp: 1700000000n,
  logIndex: 0,
  isCex: false,
  isDex: false,
  isLending: false,
  isTotal: false,
  ...overrides,
});

const VARIATION_PERIOD = {
  startTimestamp: "2023-11-14T22:13:20.000Z",
  endTimestamp: "2023-11-26T12:00:00.000Z",
};

const VARIATION_DATA = {
  accountId: VALID_ADDRESS,
  previousBalance: "1000000000000000000",
  currentBalance: "1200000000000000000",
  absoluteChange: "200000000000000000",
  percentageChange: "20",
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

  const fragments = new AccountBalanceQueryFragments(db);
  const variationsRepo = new BalanceVariationsRepository(db, fragments);
  const balanceRepo = new AccountBalanceRepository(db, fragments);
  const service = new BalanceVariationsService(variationsRepo, balanceRepo);
  app = new Hono();
  accountBalanceVariations(app, service);
});

afterAll(async () => {
  await client.close();
});

beforeEach(async () => {
  await db.delete(transfer);
  await db.delete(accountBalance);
});

describe("Account Balance Variations Controller", () => {
  describe("GET /balances/variations", () => {
    it("should return 200 with variations data", async () => {
      await db.insert(accountBalance).values(createAccountBalanceRow());
      await db.insert(transfer).values(createTransferRow());

      const res = await app.request(
        "/balances/variations?fromDate=1700000000&toDate=1701000000",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [VARIATION_DATA],
        period: VARIATION_PERIOD,
      });
    });

    it("should return 200 with empty items when no data", async () => {
      const res = await app.request("/balances/variations");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [],
        period: {
          startTimestamp: "UNBOUND",
          endTimestamp: "UNBOUND",
        },
      });
    });

    it("should accept pagination parameters", async () => {
      await db.insert(accountBalance).values([
        createAccountBalanceRow({ accountId: VALID_ADDRESS, balance: 1000n }),
        createAccountBalanceRow({
          accountId: SECOND_ADDRESS,
          balance: 2000n,
          delegate: DELEGATE_ADDRESS,
        }),
      ]);
      await db.insert(transfer).values([
        createTransferRow({
          toAccountId: VALID_ADDRESS,
          amount: 500n,
          timestamp: 1700000000n,
          logIndex: 0,
        }),
        createTransferRow({
          toAccountId: SECOND_ADDRESS,
          amount: 100n,
          timestamp: 1700000000n,
          logIndex: 1,
          transactionHash:
            "0xabc1230000000000000000000000000000000000000000000000000000000002",
        }),
      ]);

      const res = await app.request(
        "/balances/variations?skip=0&limit=1&fromDate=1700000000&toDate=1701000000",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // limit=1 returns only 1 item; desc by absoluteChange: VALID (500) first
      expect(body).toEqual({
        items: [
          {
            accountId: VALID_ADDRESS,
            previousBalance: "500",
            currentBalance: "1000",
            absoluteChange: "500",
            percentageChange: "100",
          },
        ],
        period: VARIATION_PERIOD,
      });
    });

    it("should accept fromDate and toDate parameters", async () => {
      await db.insert(accountBalance).values([
        createAccountBalanceRow({ accountId: VALID_ADDRESS, balance: 1000n }),
        createAccountBalanceRow({
          accountId: SECOND_ADDRESS,
          balance: 2000n,
          delegate: DELEGATE_ADDRESS,
        }),
      ]);
      // VALID_ADDRESS gets a transfer within the date range
      await db.insert(transfer).values([
        createTransferRow({
          toAccountId: VALID_ADDRESS,
          amount: 200n,
          timestamp: 1700000000n,
          logIndex: 0,
        }),
        // SECOND_ADDRESS gets a transfer OUTSIDE the date range
        createTransferRow({
          toAccountId: SECOND_ADDRESS,
          amount: 200n,
          timestamp: 1702000000n,
          logIndex: 1,
          transactionHash:
            "0xabc1230000000000000000000000000000000000000000000000000000000002",
        }),
      ]);

      const res = await app.request(
        "/balances/variations?fromDate=1700000000&toDate=1701000000",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only VALID_ADDRESS has a non-zero variation within the date range
      expect(body).toEqual({
        items: [
          {
            accountId: VALID_ADDRESS,
            previousBalance: "800",
            currentBalance: "1000",
            absoluteChange: "200",
            percentageChange: "25",
          },
        ],
        period: VARIATION_PERIOD,
      });
    });

    it("should accept orderDirection parameter", async () => {
      await db.insert(accountBalance).values([
        createAccountBalanceRow({ accountId: VALID_ADDRESS, balance: 1000n }),
        createAccountBalanceRow({
          accountId: SECOND_ADDRESS,
          balance: 2000n,
          delegate: DELEGATE_ADDRESS,
        }),
      ]);
      await db.insert(transfer).values([
        createTransferRow({
          toAccountId: VALID_ADDRESS,
          amount: 500n,
          timestamp: 1700000000n,
          logIndex: 0,
        }),
        createTransferRow({
          toAccountId: SECOND_ADDRESS,
          amount: 100n,
          timestamp: 1700000000n,
          logIndex: 1,
          transactionHash:
            "0xabc1230000000000000000000000000000000000000000000000000000000002",
        }),
      ]);

      const res = await app.request(
        "/balances/variations?orderDirection=asc&fromDate=1700000000&toDate=1701000000",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // asc by ABS(absoluteChange): smaller variation (100) first
      expect(body).toEqual({
        items: [
          {
            accountId: SECOND_ADDRESS,
            previousBalance: "1900",
            currentBalance: "2000",
            absoluteChange: "100",
            percentageChange: "5.26",
          },
          {
            accountId: VALID_ADDRESS,
            previousBalance: "500",
            currentBalance: "1000",
            absoluteChange: "500",
            percentageChange: "100",
          },
        ],
        period: VARIATION_PERIOD,
      });
    });

    it("should accept addresses filter", async () => {
      await db.insert(accountBalance).values([
        createAccountBalanceRow({ accountId: VALID_ADDRESS, balance: 1000n }),
        createAccountBalanceRow({
          accountId: SECOND_ADDRESS,
          balance: 2000n,
          delegate: DELEGATE_ADDRESS,
        }),
      ]);
      await db.insert(transfer).values([
        createTransferRow({
          toAccountId: VALID_ADDRESS,
          amount: 200n,
          timestamp: 1700000000n,
          logIndex: 0,
        }),
        createTransferRow({
          toAccountId: SECOND_ADDRESS,
          amount: 200n,
          timestamp: 1700000000n,
          logIndex: 1,
          transactionHash:
            "0xabc1230000000000000000000000000000000000000000000000000000000002",
        }),
      ]);

      const res = await app.request(
        `/balances/variations?addresses=${VALID_ADDRESS}&fromDate=1700000000&toDate=1701000000`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      // Only VALID_ADDRESS is returned due to the addresses filter
      expect(body).toEqual({
        items: [
          {
            accountId: VALID_ADDRESS,
            previousBalance: "800",
            currentBalance: "1000",
            absoluteChange: "200",
            percentageChange: "25",
          },
        ],
        period: VARIATION_PERIOD,
      });
    });
  });

  describe("GET /accounts/{address}/balances/variations", () => {
    it("should return 200 with variation for a single account", async () => {
      await db.insert(accountBalance).values(createAccountBalanceRow());
      await db.insert(transfer).values(createTransferRow());

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/balances/variations?fromDate=1700000000&toDate=1701000000`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        data: VARIATION_DATA,
        period: VARIATION_PERIOD,
      });
    });

    it("should return fallback when no variation exists", async () => {
      await db.insert(accountBalance).values(createAccountBalanceRow());

      const res = await app.request(
        `/accounts/${VALID_ADDRESS}/balances/variations`,
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        data: {
          accountId: VALID_ADDRESS,
          previousBalance: "1200000000000000000",
          currentBalance: "1200000000000000000",
          absoluteChange: "0",
          percentageChange: "0",
        },
        period: {
          startTimestamp: "UNBOUND",
          endTimestamp: "UNBOUND",
        },
      });
    });

    it("should return 400 for invalid address", async () => {
      const res = await app.request("/accounts/not-valid/balances/variations");

      expect(res.status).toBe(400);
    });
  });
});
