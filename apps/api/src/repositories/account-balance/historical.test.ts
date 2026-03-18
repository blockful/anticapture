import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address } from "viem";

import { balanceHistory, transfer } from "@/database/schema";
import * as schema from "@/database/schema";

import { HistoricalBalanceRepository } from "./historical";

type BalanceHistoryInsert = typeof balanceHistory.$inferInsert;
type TransferInsert = typeof transfer.$inferInsert;

const ACCOUNT_A: Address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const ACCOUNT_B: Address = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

let txCounter = 0;

const createBalanceHistory = (
  overrides: Partial<BalanceHistoryInsert> = {},
): BalanceHistoryInsert => ({
  transactionHash: `0x${(txCounter++).toString(16).padStart(64, "0")}`,
  daoId: "test-dao",
  accountId: ACCOUNT_A,
  balance: 1000n,
  delta: 200n,
  deltaMod: 200n,
  timestamp: 1700000000n,
  logIndex: 0,
  ...overrides,
});

const createTransfer = (
  overrides: Partial<TransferInsert> = {},
): TransferInsert => ({
  transactionHash: `0x${txCounter.toString(16).padStart(64, "0")}`,
  daoId: "test-dao",
  tokenId: "token-1",
  amount: 200n,
  fromAccountId: ACCOUNT_B,
  toAccountId: ACCOUNT_A,
  timestamp: 1700000000n,
  logIndex: 0,
  ...overrides,
});

describe("HistoricalBalanceRepository", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: HistoricalBalanceRepository;

  beforeAll(async () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new HistoricalBalanceRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(balanceHistory);
    await db.delete(transfer);
    txCounter = 0;
  });

  describe("getHistoricalBalances", () => {
    it("should return balances with transfer data via INNER JOIN", async () => {
      const txHash =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      await db
        .insert(balanceHistory)
        .values(createBalanceHistory({ transactionHash: txHash, logIndex: 0 }));
      await db.insert(transfer).values(
        createTransfer({
          transactionHash: txHash,
          logIndex: 0,
          amount: 200n,
        }),
      );

      const result = await repository.getHistoricalBalances(
        ACCOUNT_A,
        0,
        10,
        "desc",
        "timestamp",
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.transactionHash).toBe(txHash);
      expect(result[0]!.transfer).toBeDefined();
      expect(result[0]!.transfer.amount).toBe(200n);
    });

    it("should not return rows when transfer does not match", async () => {
      await db
        .insert(balanceHistory)
        .values(
          createBalanceHistory({ transactionHash: "0xtx1", logIndex: 0 }),
        );
      await db
        .insert(transfer)
        .values(createTransfer({ transactionHash: "0xtx2", logIndex: 0 }));

      const result = await repository.getHistoricalBalances(
        ACCOUNT_A,
        0,
        10,
        "desc",
        "timestamp",
      );

      expect(result).toHaveLength(0);
    });

    it("should filter by accountId", async () => {
      const txHash1 =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const txHash2 =
        "0x0000000000000000000000000000000000000000000000000000000000000002";
      await db.insert(balanceHistory).values([
        createBalanceHistory({
          transactionHash: txHash1,
          accountId: ACCOUNT_A,
          logIndex: 0,
        }),
        createBalanceHistory({
          transactionHash: txHash2,
          accountId: ACCOUNT_B,
          logIndex: 0,
        }),
      ]);
      await db.insert(transfer).values([
        createTransfer({ transactionHash: txHash1, logIndex: 0 }),
        createTransfer({
          transactionHash: txHash2,
          logIndex: 0,
          fromAccountId: ACCOUNT_A,
          toAccountId: ACCOUNT_B,
        }),
      ]);

      const result = await repository.getHistoricalBalances(
        ACCOUNT_A,
        0,
        10,
        "desc",
        "timestamp",
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.accountId).toBe(ACCOUNT_A);
    });

    it("should filter by minDelta and maxDelta", async () => {
      const txHash1 =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const txHash2 =
        "0x0000000000000000000000000000000000000000000000000000000000000002";
      const txHash3 =
        "0x0000000000000000000000000000000000000000000000000000000000000003";
      await db.insert(balanceHistory).values([
        createBalanceHistory({
          transactionHash: txHash1,
          deltaMod: 100n,
          logIndex: 0,
        }),
        createBalanceHistory({
          transactionHash: txHash2,
          deltaMod: 500n,
          logIndex: 0,
        }),
        createBalanceHistory({
          transactionHash: txHash3,
          deltaMod: 1000n,
          logIndex: 0,
        }),
      ]);
      await db
        .insert(transfer)
        .values([
          createTransfer({ transactionHash: txHash1, logIndex: 0 }),
          createTransfer({ transactionHash: txHash2, logIndex: 0 }),
          createTransfer({ transactionHash: txHash3, logIndex: 0 }),
        ]);

      const result = await repository.getHistoricalBalances(
        ACCOUNT_A,
        0,
        10,
        "desc",
        "delta",
        "200",
        "800",
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.deltaMod).toBe(500n);
    });

    it("should filter by date range", async () => {
      const txHash1 =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const txHash2 =
        "0x0000000000000000000000000000000000000000000000000000000000000002";
      await db.insert(balanceHistory).values([
        createBalanceHistory({
          transactionHash: txHash1,
          timestamp: 1000n,
          logIndex: 0,
        }),
        createBalanceHistory({
          transactionHash: txHash2,
          timestamp: 3000n,
          logIndex: 0,
        }),
      ]);
      await db.insert(transfer).values([
        createTransfer({
          transactionHash: txHash1,
          logIndex: 0,
          timestamp: 1000n,
        }),
        createTransfer({
          transactionHash: txHash2,
          logIndex: 0,
          timestamp: 3000n,
        }),
      ]);

      const result = await repository.getHistoricalBalances(
        ACCOUNT_A,
        0,
        10,
        "desc",
        "timestamp",
        undefined,
        undefined,
        2000,
        4000,
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.timestamp).toBe(3000n);
    });

    it("should sort by timestamp descending", async () => {
      const txHash1 =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const txHash2 =
        "0x0000000000000000000000000000000000000000000000000000000000000002";
      await db.insert(balanceHistory).values([
        createBalanceHistory({
          transactionHash: txHash1,
          timestamp: 1000n,
          logIndex: 0,
        }),
        createBalanceHistory({
          transactionHash: txHash2,
          timestamp: 2000n,
          logIndex: 0,
        }),
      ]);
      await db.insert(transfer).values([
        createTransfer({
          transactionHash: txHash1,
          logIndex: 0,
          timestamp: 1000n,
        }),
        createTransfer({
          transactionHash: txHash2,
          logIndex: 0,
          timestamp: 2000n,
        }),
      ]);

      const result = await repository.getHistoricalBalances(
        ACCOUNT_A,
        0,
        10,
        "desc",
        "timestamp",
      );

      expect(result[0]!.timestamp).toBe(2000n);
      expect(result[1]!.timestamp).toBe(1000n);
    });

    it("should sort by delta ascending", async () => {
      const txHash1 =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const txHash2 =
        "0x0000000000000000000000000000000000000000000000000000000000000002";
      await db.insert(balanceHistory).values([
        createBalanceHistory({
          transactionHash: txHash1,
          deltaMod: 500n,
          logIndex: 0,
        }),
        createBalanceHistory({
          transactionHash: txHash2,
          deltaMod: 100n,
          logIndex: 0,
        }),
      ]);
      await db
        .insert(transfer)
        .values([
          createTransfer({ transactionHash: txHash1, logIndex: 0 }),
          createTransfer({ transactionHash: txHash2, logIndex: 0 }),
        ]);

      const result = await repository.getHistoricalBalances(
        ACCOUNT_A,
        0,
        10,
        "asc",
        "delta",
      );

      expect(result[0]!.deltaMod).toBe(100n);
      expect(result[1]!.deltaMod).toBe(500n);
    });

    it("should apply pagination", async () => {
      const txHash1 =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      const txHash2 =
        "0x0000000000000000000000000000000000000000000000000000000000000002";
      const txHash3 =
        "0x0000000000000000000000000000000000000000000000000000000000000003";
      await db.insert(balanceHistory).values([
        createBalanceHistory({
          transactionHash: txHash1,
          timestamp: 3000n,
          logIndex: 0,
        }),
        createBalanceHistory({
          transactionHash: txHash2,
          timestamp: 2000n,
          logIndex: 0,
        }),
        createBalanceHistory({
          transactionHash: txHash3,
          timestamp: 1000n,
          logIndex: 0,
        }),
      ]);
      await db.insert(transfer).values([
        createTransfer({
          transactionHash: txHash1,
          logIndex: 0,
          timestamp: 3000n,
        }),
        createTransfer({
          transactionHash: txHash2,
          logIndex: 0,
          timestamp: 2000n,
        }),
        createTransfer({
          transactionHash: txHash3,
          logIndex: 0,
          timestamp: 1000n,
        }),
      ]);

      const result = await repository.getHistoricalBalances(
        ACCOUNT_A,
        1,
        1,
        "desc",
        "timestamp",
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.timestamp).toBe(2000n);
    });

    it("should return empty when no data exists", async () => {
      const result = await repository.getHistoricalBalances(
        ACCOUNT_A,
        0,
        10,
        "desc",
        "timestamp",
      );

      expect(result).toEqual([]);
    });
  });

  describe("getHistoricalBalanceCount", () => {
    it("should return count for an account", async () => {
      await db
        .insert(balanceHistory)
        .values([
          createBalanceHistory({ logIndex: 0 }),
          createBalanceHistory({ logIndex: 1 }),
          createBalanceHistory({ logIndex: 2 }),
        ]);

      const count = await repository.getHistoricalBalanceCount(ACCOUNT_A);

      expect(count).toBe(3);
    });

    it("should filter count by minDelta and maxDelta", async () => {
      await db
        .insert(balanceHistory)
        .values([
          createBalanceHistory({ deltaMod: 100n, logIndex: 0 }),
          createBalanceHistory({ deltaMod: 500n, logIndex: 1 }),
          createBalanceHistory({ deltaMod: 1000n, logIndex: 2 }),
        ]);

      const count = await repository.getHistoricalBalanceCount(
        ACCOUNT_A,
        "200",
        "800",
      );

      expect(count).toBe(1);
    });

    it("should return 0 when no data exists", async () => {
      const count = await repository.getHistoricalBalanceCount(ACCOUNT_A);

      expect(count).toBe(0);
    });
  });
});
