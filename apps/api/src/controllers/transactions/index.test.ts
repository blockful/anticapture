import { OpenAPIHono as Hono } from "@hono/zod-openapi";
import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { getAddress } from "viem";
import * as schema from "@/database/schema";
import { transaction, transfer, delegation } from "@/database/schema";
import { TransactionsRepository } from "@/repositories/transactions";
import { TransactionsService } from "@/services";
import { transactions } from "./index";
const TX_HASH = "0xabc123def456";

type TransactionInsert = typeof transaction.$inferInsert;
type TransferInsert = typeof transfer.$inferInsert;
type DelegationInsert = typeof delegation.$inferInsert;

const createTransaction = (
  overrides: Partial<TransactionInsert> = {},
): TransactionInsert => ({
  transactionHash: TX_HASH,
  fromAddress: getAddress("0x1111111111111111111111111111111111111111"),
  toAddress: getAddress("0x2222222222222222222222222222222222222222"),
  isCex: false,
  isDex: false,
  isLending: false,
  isTotal: false,
  timestamp: 1700000000n,
  ...overrides,
});

const createTransfer = (
  overrides: Partial<TransferInsert> = {},
): TransferInsert => ({
  transactionHash: TX_HASH,
  daoId: "UNI",
  tokenId: "uni",
  amount: 1000n,
  fromAccountId: getAddress("0x1111111111111111111111111111111111111111"),
  toAccountId: getAddress("0x2222222222222222222222222222222222222222"),
  timestamp: 1700000000n,
  logIndex: 0,
  isCex: false,
  isDex: false,
  isLending: false,
  isTotal: false,
  ...overrides,
});

const createDelegation = (
  overrides: Partial<DelegationInsert> = {},
): DelegationInsert => ({
  transactionHash: TX_HASH,
  daoId: "UNI",
  delegateAccountId: getAddress("0x3333333333333333333333333333333333333333"),
  delegatorAccountId: getAddress("0x1111111111111111111111111111111111111111"),
  delegatedValue: 5000n,
  timestamp: 1700000000n,
  logIndex: 0,
  isCex: false,
  isDex: false,
  isLending: false,
  isTotal: false,
  ...overrides,
});

describe("Transactions Controller", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let app: Hono;

  beforeAll(async () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema, casing: "snake_case" });

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();

    const repo = new TransactionsRepository(db);
    const service = new TransactionsService(repo);
    app = new Hono();
    transactions(app, service);
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(transfer);
    await db.delete(delegation);
    await db.delete(transaction);
  });

  describe("GET /transactions", () => {
    it("should return 200 with empty items and totalCount=0 when no data", async () => {
      const res = await app.request("/transactions");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body).toEqual({ items: [], totalCount: 0 });
    });

    it("should return 200 with 1 item when a transfer and transaction row share the same hash", async () => {
      await db.insert(transaction).values(createTransaction());
      await db.insert(transfer).values(createTransfer());

      const res = await app.request("/transactions");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalCount).toBe(1);
      expect(body.items).toHaveLength(1);
      expect(body.items[0]).toMatchObject({
        transactionHash: TX_HASH,
        timestamp: "1700000000",
      });
    });

    it("should return 200 with item when a delegation and transaction row share the same hash", async () => {
      await db.insert(transaction).values(createTransaction());
      await db.insert(delegation).values(createDelegation());

      const res = await app.request("/transactions");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.totalCount).toBe(1);
      expect(body.items).toHaveLength(1);
      expect(body.items[0]).toMatchObject({
        transactionHash: TX_HASH,
        timestamp: "1700000000",
      });
    });

    it("should return 200 with limit and offset query params applied", async () => {
      const res = await app.request("/transactions?limit=10&offset=5");

      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.items).toHaveLength(0);
      expect(body.totalCount).toBe(0);
    });
  });
});
