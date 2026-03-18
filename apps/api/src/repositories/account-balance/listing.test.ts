import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address } from "viem";

import { accountBalance, transfer } from "@/database/schema";
import * as schema from "@/database/schema";
import { AmountFilter } from "@/mappers";

import { AccountBalanceQueryFragments } from "./common";
import { AccountBalanceRepository } from "./listing";

type AccountBalanceInsert = typeof accountBalance.$inferInsert;
type TransferInsert = typeof transfer.$inferInsert;

const ACCOUNT_A: Address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const ACCOUNT_B: Address = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const ACCOUNT_C: Address = "0xcccccccccccccccccccccccccccccccccccccccc";
const DELEGATE_A: Address = "0xdddddddddddddddddddddddddddddddddddddddd";
const TOKEN_ID: Address = "0x1111111111111111111111111111111111111111";

const NO_FILTER: AmountFilter = { minAmount: undefined, maxAmount: undefined };

let txCounter = 0;

const createAccountBalance = (
  overrides: Partial<AccountBalanceInsert> = {},
): AccountBalanceInsert => ({
  accountId: ACCOUNT_A,
  tokenId: TOKEN_ID,
  balance: 1000n,
  ...overrides,
});

const createTransfer = (
  overrides: Partial<TransferInsert> = {},
): TransferInsert => ({
  transactionHash: `0x${(txCounter++).toString(16).padStart(64, "0")}`,
  daoId: "test-dao",
  tokenId: TOKEN_ID,
  amount: 100n,
  fromAccountId: ACCOUNT_A,
  toAccountId: ACCOUNT_B,
  timestamp: 1700000000n,
  logIndex: 0,
  ...overrides,
});

describe("AccountBalanceRepository", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: AccountBalanceRepository;

  beforeAll(async () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    const fragments = new AccountBalanceQueryFragments(db);
    repository = new AccountBalanceRepository(db, fragments);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(transfer);
    await db.delete(accountBalance);
    txCounter = 0;
  });

  describe("getAccountBalances", () => {
    it("should return items and totalCount", async () => {
      await db
        .insert(accountBalance)
        .values([
          createAccountBalance({ accountId: ACCOUNT_A, balance: 500n }),
          createAccountBalance({ accountId: ACCOUNT_B, balance: 1000n }),
        ]);

      const result = await repository.getAccountBalances(
        0,
        10,
        "desc",
        [],
        [],
        [],
        NO_FILTER,
      );

      expect(result.items).toHaveLength(2);
      expect(result.totalCount).toBe(2);
    });

    it("should order by balance descending", async () => {
      await db
        .insert(accountBalance)
        .values([
          createAccountBalance({ accountId: ACCOUNT_A, balance: 500n }),
          createAccountBalance({ accountId: ACCOUNT_B, balance: 1000n }),
        ]);

      const result = await repository.getAccountBalances(
        0,
        10,
        "desc",
        [],
        [],
        [],
        NO_FILTER,
      );

      expect(result.items[0]!.balance).toBe(1000n);
      expect(result.items[1]!.balance).toBe(500n);
    });

    it("should order by balance ascending", async () => {
      await db
        .insert(accountBalance)
        .values([
          createAccountBalance({ accountId: ACCOUNT_A, balance: 500n }),
          createAccountBalance({ accountId: ACCOUNT_B, balance: 1000n }),
        ]);

      const result = await repository.getAccountBalances(
        0,
        10,
        "asc",
        [],
        [],
        [],
        NO_FILTER,
      );

      expect(result.items[0]!.balance).toBe(500n);
      expect(result.items[1]!.balance).toBe(1000n);
    });

    it("should filter by addresses", async () => {
      await db
        .insert(accountBalance)
        .values([
          createAccountBalance({ accountId: ACCOUNT_A, balance: 500n }),
          createAccountBalance({ accountId: ACCOUNT_B, balance: 1000n }),
        ]);

      const result = await repository.getAccountBalances(
        0,
        10,
        "desc",
        [ACCOUNT_A],
        [],
        [],
        NO_FILTER,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.accountId).toBe(ACCOUNT_A);
      expect(result.totalCount).toBe(1);
    });

    it("should filter by delegates", async () => {
      await db.insert(accountBalance).values([
        createAccountBalance({
          accountId: ACCOUNT_A,
          delegate: DELEGATE_A,
          balance: 500n,
        }),
        createAccountBalance({ accountId: ACCOUNT_B, balance: 1000n }),
      ]);

      const result = await repository.getAccountBalances(
        0,
        10,
        "desc",
        [],
        [DELEGATE_A],
        [],
        NO_FILTER,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.accountId).toBe(ACCOUNT_A);
    });

    it("should filter by excludeAddresses", async () => {
      await db
        .insert(accountBalance)
        .values([
          createAccountBalance({ accountId: ACCOUNT_A, balance: 500n }),
          createAccountBalance({ accountId: ACCOUNT_B, balance: 1000n }),
        ]);

      const result = await repository.getAccountBalances(
        0,
        10,
        "desc",
        [],
        [],
        [ACCOUNT_A],
        NO_FILTER,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.accountId).toBe(ACCOUNT_B);
    });

    it("should filter by amountFilter", async () => {
      await db
        .insert(accountBalance)
        .values([
          createAccountBalance({ accountId: ACCOUNT_A, balance: 100n }),
          createAccountBalance({ accountId: ACCOUNT_B, balance: 500n }),
          createAccountBalance({ accountId: ACCOUNT_C, balance: 1000n }),
        ]);

      const result = await repository.getAccountBalances(
        0,
        10,
        "desc",
        [],
        [],
        [],
        { minAmount: 200, maxAmount: 800 },
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.accountId).toBe(ACCOUNT_B);
    });

    it("should apply pagination", async () => {
      await db
        .insert(accountBalance)
        .values([
          createAccountBalance({ accountId: ACCOUNT_A, balance: 300n }),
          createAccountBalance({ accountId: ACCOUNT_B, balance: 200n }),
          createAccountBalance({ accountId: ACCOUNT_C, balance: 100n }),
        ]);

      const result = await repository.getAccountBalances(
        1,
        1,
        "desc",
        [],
        [],
        [],
        NO_FILTER,
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.balance).toBe(200n);
      expect(result.totalCount).toBe(3);
    });

    it("should return empty when no data exists", async () => {
      const result = await repository.getAccountBalances(
        0,
        10,
        "desc",
        [],
        [],
        [],
        NO_FILTER,
      );

      expect(result).toEqual({ items: [], totalCount: 0 });
    });
  });

  describe("getAccountBalance", () => {
    it("should return a single account balance", async () => {
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: TOKEN_ID,
          balance: 500n,
        }),
      );

      const result = await repository.getAccountBalance(ACCOUNT_A);

      expect(result).toBeDefined();
      expect(result!.accountId).toBe(ACCOUNT_A);
      expect(result!.balance).toBe(500n);
    });

    it("should return undefined for non-existent account", async () => {
      const result = await repository.getAccountBalance(ACCOUNT_A);

      expect(result).toBeUndefined();
    });
  });

  describe("getAccountBalancesWithVariation", () => {
    it("should return items with variation data", async () => {
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: ACCOUNT_B,
          tokenId: TOKEN_ID,
          balance: 1200n,
        }),
      );
      await db.insert(transfer).values(
        createTransfer({
          fromAccountId: ACCOUNT_A,
          toAccountId: ACCOUNT_B,
          amount: 200n,
        }),
      );

      const result = await repository.getAccountBalancesWithVariation(
        0,
        2000000000,
        0,
        10,
        "desc",
        "balance",
        [],
        [],
        [],
        NO_FILTER,
      );

      expect(result.items.length).toBeGreaterThanOrEqual(1);
      const row = result.items.find((i) => i.accountId === ACCOUNT_B);
      expect(row).toBeDefined();
      expect(row!.absoluteChange).toBe(200n);
    });

    it("should order by variation", async () => {
      await db.insert(accountBalance).values([
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: TOKEN_ID,
          balance: 1000n,
        }),
        createAccountBalance({
          accountId: ACCOUNT_B,
          tokenId: TOKEN_ID,
          balance: 500n,
        }),
      ]);
      await db.insert(transfer).values([
        createTransfer({
          fromAccountId: ACCOUNT_C,
          toAccountId: ACCOUNT_A,
          amount: 100n,
        }),
        createTransfer({
          fromAccountId: ACCOUNT_C,
          toAccountId: ACCOUNT_B,
          amount: 500n,
        }),
      ]);

      const result = await repository.getAccountBalancesWithVariation(
        0,
        2000000000,
        0,
        10,
        "desc",
        "variation",
        [],
        [],
        [],
        NO_FILTER,
      );

      expect(result.items.length).toBeGreaterThanOrEqual(2);
      expect(
        Math.abs(Number(result.items[0]!.absoluteChange)),
      ).toBeGreaterThanOrEqual(
        Math.abs(Number(result.items[1]!.absoluteChange)),
      );
    });

    it("should compute percentageChange", async () => {
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: ACCOUNT_B,
          tokenId: TOKEN_ID,
          balance: 1200n,
        }),
      );
      await db.insert(transfer).values(
        createTransfer({
          fromAccountId: ACCOUNT_A,
          toAccountId: ACCOUNT_B,
          amount: 200n,
        }),
      );

      const result = await repository.getAccountBalancesWithVariation(
        0,
        2000000000,
        0,
        10,
        "desc",
        "balance",
        [],
        [],
        [],
        NO_FILTER,
      );

      const row = result.items.find((i) => i.accountId === ACCOUNT_B);
      expect(row).toBeDefined();
      expect(row!.percentageChange).toBe("20");
    });

    it("should return totalCount", async () => {
      await db.insert(accountBalance).values([
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: TOKEN_ID,
          balance: 1000n,
        }),
        createAccountBalance({
          accountId: ACCOUNT_B,
          tokenId: TOKEN_ID,
          balance: 500n,
        }),
      ]);

      const result = await repository.getAccountBalancesWithVariation(
        0,
        2000000000,
        0,
        1,
        "desc",
        "balance",
        [],
        [],
        [],
        NO_FILTER,
      );

      expect(result.items).toHaveLength(1);
      expect(result.totalCount).toBe(2);
    });
  });

  describe("getAccountBalanceWithVariation", () => {
    it("should return variation for a single account", async () => {
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: TOKEN_ID,
          balance: 1200n,
        }),
      );
      await db.insert(transfer).values(
        createTransfer({
          fromAccountId: ACCOUNT_B,
          toAccountId: ACCOUNT_A,
          amount: 200n,
        }),
      );

      const result = await repository.getAccountBalanceWithVariation(
        ACCOUNT_A,
        0,
        2000000000,
      );

      expect(result).toBeDefined();
      expect(result!.accountId).toBe(ACCOUNT_A);
      expect(result!.absoluteChange).toBe(200n);
      expect(result!.currentBalance).toBe(1200n);
    });

    it("should return undefined for non-existent account", async () => {
      const result = await repository.getAccountBalanceWithVariation(
        ACCOUNT_A,
        0,
        2000000000,
      );

      expect(result).toBeUndefined();
    });
  });
});
