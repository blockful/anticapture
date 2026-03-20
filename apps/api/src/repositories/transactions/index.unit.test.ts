import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address } from "viem";

import type { Drizzle } from "@/database";
import { transaction, transfer, delegation } from "@/database/schema";
import * as schema from "@/database/schema";
import { TransactionsRequest } from "@/mappers/transactions";

import { TransactionsRepository } from ".";

type TransactionInsert = typeof transaction.$inferInsert;
type TransferInsert = typeof transfer.$inferInsert;
type DelegationInsert = typeof delegation.$inferInsert;

const ACCOUNT_A: Address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const ACCOUNT_B: Address = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const TEST_DAO = "test-dao";

let txCounter = 0;

const createTransaction = (
  overrides: Partial<TransactionInsert> = {},
): TransactionInsert => ({
  transactionHash: `0x${(txCounter++).toString(16).padStart(64, "0")}`,
  fromAddress: ACCOUNT_A,
  toAddress: ACCOUNT_B,
  timestamp: 1700000000n,
  ...overrides,
});

const createTransfer = (
  overrides: Partial<TransferInsert> = {},
): TransferInsert => ({
  transactionHash: `0x${txCounter.toString(16).padStart(64, "0")}`,
  daoId: TEST_DAO,
  tokenId: "token-1",
  amount: 100n,
  fromAccountId: ACCOUNT_A,
  toAccountId: ACCOUNT_B,
  timestamp: 1700000000n,
  logIndex: 0,
  ...overrides,
});

const createDelegation = (
  overrides: Partial<DelegationInsert> = {},
): DelegationInsert => ({
  transactionHash: `0x${txCounter.toString(16).padStart(64, "0")}`,
  daoId: TEST_DAO,
  delegateAccountId: ACCOUNT_B,
  delegatorAccountId: ACCOUNT_A,
  delegatedValue: 100n,
  timestamp: 1700000000n,
  logIndex: 0,
  ...overrides,
});

const defaultFilter = (
  overrides: Partial<TransactionsRequest> = {},
): TransactionsRequest => ({
  limit: 50,
  offset: 0,
  sortBy: "timestamp",
  sortOrder: "desc",
  affectedSupply: {},
  includes: { transfers: true, delegations: true },
  ...overrides,
});

describe("TransactionsRepository", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: TransactionsRepository;

  beforeAll(async () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new TransactionsRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(transfer);
    await db.delete(delegation);
    await db.delete(transaction);
    txCounter = 0;
  });

  describe("getFilteredAggregateTransactions", () => {
    it("should return transactions with nested transfers", async () => {
      const txHash =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      await db
        .insert(transaction)
        .values(createTransaction({ transactionHash: txHash }));
      await db
        .insert(transfer)
        .values(createTransfer({ transactionHash: txHash, amount: 200n }));

      const result =
        await repository.getFilteredAggregateTransactions(defaultFilter());

      expect(result).toHaveLength(1);
      expect(result[0]!.transactionHash).toBe(txHash);
      expect(result[0]!.transfers).toHaveLength(1);
    });

    it("should return transactions with nested delegations", async () => {
      const txHash =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      await db
        .insert(transaction)
        .values(createTransaction({ transactionHash: txHash }));
      await db
        .insert(delegation)
        .values(
          createDelegation({ transactionHash: txHash, delegatedValue: 500n }),
        );

      const result =
        await repository.getFilteredAggregateTransactions(defaultFilter());

      expect(result).toHaveLength(1);
      expect(result[0]!.delegations).toHaveLength(1);
    });

    it("should return empty arrays when no nested data", async () => {
      const txHash =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      await db
        .insert(transaction)
        .values(createTransaction({ transactionHash: txHash }));
      await db
        .insert(transfer)
        .values(createTransfer({ transactionHash: txHash }));

      const result =
        await repository.getFilteredAggregateTransactions(defaultFilter());

      expect(result).toHaveLength(1);
      expect(Array.isArray(result[0]!.transfers)).toBe(true);
      expect(Array.isArray(result[0]!.delegations)).toBe(true);
    });

    it("should filter by date range", async () => {
      const txHash1 =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const txHash2 =
        "0x0000000000000000000000000000000000000000000000000000000000000002";
      await db
        .insert(transaction)
        .values([
          createTransaction({ transactionHash: txHash1, timestamp: 1000n }),
          createTransaction({ transactionHash: txHash2, timestamp: 3000n }),
        ]);
      await db
        .insert(transfer)
        .values([
          createTransfer({ transactionHash: txHash1, timestamp: 1000n }),
          createTransfer({ transactionHash: txHash2, timestamp: 3000n }),
        ]);

      const result = await repository.getFilteredAggregateTransactions(
        defaultFilter({ fromDate: 2000, toDate: 4000 }),
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.transactionHash).toBe(txHash2);
    });

    it("should apply pagination", async () => {
      const txHash1 =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const txHash2 =
        "0x0000000000000000000000000000000000000000000000000000000000000002";
      await db
        .insert(transaction)
        .values([
          createTransaction({ transactionHash: txHash1, timestamp: 2000n }),
          createTransaction({ transactionHash: txHash2, timestamp: 1000n }),
        ]);
      await db
        .insert(transfer)
        .values([
          createTransfer({ transactionHash: txHash1, timestamp: 2000n }),
          createTransfer({ transactionHash: txHash2, timestamp: 1000n }),
        ]);

      const result = await repository.getFilteredAggregateTransactions(
        defaultFilter({ limit: 1, offset: 0 }),
      );

      expect(result).toHaveLength(1);
    });

    it("should return empty when no data exists", async () => {
      const result =
        await repository.getFilteredAggregateTransactions(defaultFilter());

      expect(result).toEqual([]);
    });

    it("should filter transfers only when includes.delegations is false", async () => {
      const txHash =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      await db
        .insert(transaction)
        .values(createTransaction({ transactionHash: txHash }));
      await db
        .insert(transfer)
        .values(createTransfer({ transactionHash: txHash }));

      const result = await repository.getFilteredAggregateTransactions(
        defaultFilter({ includes: { transfers: true, delegations: false } }),
      );

      expect(result).toHaveLength(1);
    });

    it("should filter delegations only when includes.transfers is false", async () => {
      const txHash =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      await db
        .insert(transaction)
        .values(createTransaction({ transactionHash: txHash }));
      await db
        .insert(delegation)
        .values(createDelegation({ transactionHash: txHash }));

      const result = await repository.getFilteredAggregateTransactions(
        defaultFilter({ includes: { transfers: false, delegations: true } }),
      );

      expect(result).toHaveLength(1);
    });

    it("should filter by from address", async () => {
      const txHash1 =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const txHash2 =
        "0x0000000000000000000000000000000000000000000000000000000000000002";
      await db
        .insert(transaction)
        .values([
          createTransaction({ transactionHash: txHash1 }),
          createTransaction({ transactionHash: txHash2 }),
        ]);
      await db.insert(transfer).values([
        createTransfer({
          transactionHash: txHash1,
          fromAccountId: ACCOUNT_A,
        }),
        createTransfer({
          transactionHash: txHash2,
          fromAccountId: ACCOUNT_B,
        }),
      ]);

      const result = await repository.getFilteredAggregateTransactions(
        defaultFilter({ from: ACCOUNT_A }),
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.transactionHash).toBe(txHash1);
    });
  });

  describe("getAggregatedTransactionsCount", () => {
    it("should return count of distinct transaction hashes", async () => {
      const txHash1 =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const txHash2 =
        "0x0000000000000000000000000000000000000000000000000000000000000002";
      await db
        .insert(transfer)
        .values([
          createTransfer({ transactionHash: txHash1, timestamp: 1700000000n }),
          createTransfer({ transactionHash: txHash2, timestamp: 1700000000n }),
        ]);

      const count =
        await repository.getAggregatedTransactionsCount(defaultFilter());

      expect(count).toBe(2);
    });

    it("should count delegations as well", async () => {
      const txHash =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      await db
        .insert(delegation)
        .values(
          createDelegation({ transactionHash: txHash, timestamp: 1700000000n }),
        );

      const count =
        await repository.getAggregatedTransactionsCount(defaultFilter());

      expect(count).toBe(1);
    });

    it("should return 0 when no data exists", async () => {
      const count =
        await repository.getAggregatedTransactionsCount(defaultFilter());

      expect(count).toBe(0);
    });

    it("should filter by date range", async () => {
      const txHash1 =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const txHash2 =
        "0x0000000000000000000000000000000000000000000000000000000000000002";
      await db
        .insert(transfer)
        .values([
          createTransfer({ transactionHash: txHash1, timestamp: 1000n }),
          createTransfer({ transactionHash: txHash2, timestamp: 3000n }),
        ]);

      const count = await repository.getAggregatedTransactionsCount(
        defaultFilter({ fromDate: 2000, toDate: 4000 }),
      );

      expect(count).toBe(1);
    });
  });
});
