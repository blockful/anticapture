import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { getAddress } from "viem";
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
import { accountBalance, transfer } from "@/database/schema";
import { DaoIdEnum } from "@/lib/enums";
import { AccountBalanceQueryFragments } from "@/repositories/account-balance/common";
import { AccountBalanceRepository } from "@/repositories/account-balance/listing";
import { AccountBalanceService } from "@/services";
import { accountBalances } from "./listing";

type AccountBalanceInsert = typeof accountBalance.$inferInsert;
type TransferInsert = typeof transfer.$inferInsert;

const VALID_ADDRESS = getAddress("0x1234567890123456789012345678901234567890");
const SECOND_ADDRESS = getAddress("0x2222222222222222222222222222222222222222");
const DELEGATE_ADDRESS = getAddress(
  "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
);
const TOKEN_ID = getAddress("0xC18360217D8F7Ab5e7c516566761Ea12Ce7F9D72");

const createAccountBalanceRow = (
  overrides: Partial<AccountBalanceInsert> = {},
): AccountBalanceInsert => ({
  accountId: VALID_ADDRESS,
  tokenId: TOKEN_ID,
  balance: 1200000000000000000n,
  delegate: DELEGATE_ADDRESS,
  ...overrides,
});

const createTransferRow = (
  overrides: Partial<TransferInsert> = {},
): TransferInsert => ({
  transactionHash:
    "0xabc1230000000000000000000000000000000000000000000000000000000001",
  daoId: "ENS",
  tokenId: TOKEN_ID,
  amount: 100n,
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

const DEFAULT_PERIOD = {
  startTimestamp: "2023-10-17T00:00:00.000Z",
  endTimestamp: "2024-01-15T00:00:00.000Z",
};

const ACCOUNT_BALANCE_ITEM = {
  address: VALID_ADDRESS,
  balance: "1200000000000000000",
  tokenId: TOKEN_ID,
  delegate: DELEGATE_ADDRESS,
  variation: {
    previousBalance: "1200000000000000000",
    absoluteChange: "0",
    percentageChange: "0",
  },
};

let client: PGlite;
let db: Drizzle;
let app: Hono;

beforeAll(async () => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2024-01-15T00:00:00Z"));

  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  (BigInt.prototype as any).toJSON = function () {
    return this.toString();
  };
  client = new PGlite();
  db = drizzle(client, { schema });
  /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
  const { apply } = await pushSchema(schema, db as any);
  await apply();

  const fragments = new AccountBalanceQueryFragments(db);
  const repo = new AccountBalanceRepository(db, fragments);
  const service = new AccountBalanceService(repo);
  app = new Hono();
  accountBalances(app, DaoIdEnum.ENS, service);
});

afterAll(async () => {
  vi.useRealTimers();
  await client.close();
});

beforeEach(async () => {
  await db.delete(transfer);
  await db.delete(accountBalance);
});

describe("Account Balances Controller", () => {
  describe("GET /balances", () => {
    it("should return 200 with balances and period", async () => {
      await db.insert(accountBalance).values(createAccountBalanceRow());

      const res = await app.request("/balances");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [ACCOUNT_BALANCE_ITEM],
        totalCount: 1,
        period: DEFAULT_PERIOD,
      });
    });

    it("should return 200 with empty items when no data", async () => {
      const res = await app.request("/balances");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [],
        totalCount: 0,
        period: DEFAULT_PERIOD,
      });
    });

    it("should accept pagination parameters", async () => {
      await db.insert(accountBalance).values(createAccountBalanceRow());

      const res = await app.request("/balances?skip=0&limit=10");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [ACCOUNT_BALANCE_ITEM],
        totalCount: 1,
        period: DEFAULT_PERIOD,
      });
    });

    it("should accept orderBy=variation", async () => {
      await db.insert(accountBalance).values([
        createAccountBalanceRow({ accountId: VALID_ADDRESS, balance: 1000n }),
        createAccountBalanceRow({
          accountId: SECOND_ADDRESS,
          balance: 2000n,
          delegate: DELEGATE_ADDRESS,
        }),
      ]);
      // Transfers within the default 90-day window (fake time = 2024-01-15)
      await db.insert(transfer).values([
        createTransferRow({
          toAccountId: VALID_ADDRESS,
          amount: 500n,
          logIndex: 0,
        }),
        createTransferRow({
          toAccountId: SECOND_ADDRESS,
          amount: 100n,
          logIndex: 1,
          transactionHash:
            "0xabc1230000000000000000000000000000000000000000000000000000000002",
        }),
      ]);

      const res = await app.request(
        "/balances?orderBy=variation&orderDirection=desc",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalCount).toBe(2);
      // VALID_ADDRESS has larger variation (500), SECOND_ADDRESS has smaller (100)
      expect(body.items[0].address).toBe(VALID_ADDRESS);
      expect(body.items[1].address).toBe(SECOND_ADDRESS);
    });

    it("should accept orderDirection=asc", async () => {
      await db.insert(accountBalance).values([
        createAccountBalanceRow({ accountId: VALID_ADDRESS, balance: 1000n }),
        createAccountBalanceRow({
          accountId: SECOND_ADDRESS,
          balance: 2000n,
          delegate: DELEGATE_ADDRESS,
        }),
      ]);

      const res = await app.request("/balances?orderDirection=asc");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalCount).toBe(2);
      // asc by balance: smaller balance first
      expect(body.items[0].balance).toBe("1000");
      expect(body.items[1].balance).toBe("2000");
    });

    it("should accept addresses filter", async () => {
      await db.insert(accountBalance).values([
        createAccountBalanceRow({ accountId: VALID_ADDRESS }),
        createAccountBalanceRow({
          accountId: SECOND_ADDRESS,
          delegate: DELEGATE_ADDRESS,
        }),
      ]);

      const res = await app.request(`/balances?addresses=${VALID_ADDRESS}`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalCount).toBe(1);
      expect(body.items).toHaveLength(1);
      expect(body.items[0].address).toBe(VALID_ADDRESS);
    });

    it("should accept fromDate and toDate parameters to override defaults", async () => {
      await db.insert(accountBalance).values(createAccountBalanceRow());

      const res = await app.request(
        "/balances?fromDate=1700000000&toDate=1701000000",
      );

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [ACCOUNT_BALANCE_ITEM],
        totalCount: 1,
        period: {
          startTimestamp: "2023-11-14T22:13:20.000Z",
          endTimestamp: "2023-11-26T12:00:00.000Z",
        },
      });
    });

    it("should use default date range when fromDate and toDate not provided", async () => {
      await db.insert(accountBalance).values(createAccountBalanceRow());

      const res = await app.request("/balances");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [ACCOUNT_BALANCE_ITEM],
        totalCount: 1,
        period: DEFAULT_PERIOD,
      });
    });

    it("should include variation data in response items", async () => {
      await db
        .insert(accountBalance)
        .values(createAccountBalanceRow({ balance: 1000n }));

      const res = await app.request("/balances");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        items: [
          {
            ...ACCOUNT_BALANCE_ITEM,
            balance: "1000",
            variation: {
              previousBalance: "1000",
              absoluteChange: "0",
              percentageChange: "0",
            },
          },
        ],
        totalCount: 1,
        period: DEFAULT_PERIOD,
      });
    });
  });

  describe("GET /accounts/{address}/balances", () => {
    it("should return 200 with balance for a single account", async () => {
      await db.insert(accountBalance).values(createAccountBalanceRow());

      const res = await app.request(`/accounts/${VALID_ADDRESS}/balances`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        data: ACCOUNT_BALANCE_ITEM,
        period: DEFAULT_PERIOD,
      });
    });

    it("should use default dates when not provided", async () => {
      await db.insert(accountBalance).values(createAccountBalanceRow());

      const res = await app.request(`/accounts/${VALID_ADDRESS}/balances`);

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({
        data: ACCOUNT_BALANCE_ITEM,
        period: DEFAULT_PERIOD,
      });
    });

    it("should return 400 for invalid address", async () => {
      const res = await app.request("/accounts/not-valid/balances");

      expect(res.status).toBe(400);
    });
  });
});
