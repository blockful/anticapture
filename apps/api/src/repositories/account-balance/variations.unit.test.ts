import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address } from "viem";

import type { Drizzle } from "@/database";
import { accountBalance, transfer } from "@/database/schema";
import * as schema from "@/database/schema";

import { AccountBalanceQueryFragments } from "./common";
import { BalanceVariationsRepository } from "./variations";

type AccountBalanceInsert = typeof accountBalance.$inferInsert;
type TransferInsert = typeof transfer.$inferInsert;

const ACCOUNT_A: Address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const ACCOUNT_B: Address = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const ACCOUNT_C: Address = "0xcccccccccccccccccccccccccccccccccccccccc";

let txCounter = 0;

const createAccountBalance = (
  overrides: Partial<AccountBalanceInsert> = {},
): AccountBalanceInsert => {
  const n = txCounter++;
  return {
    id: `ab-${n}`,
    accountId: ACCOUNT_A,
    tokenId: `token-${n}`,
    balance: 1000n,
    ...overrides,
  };
};

const createTransfer = (
  overrides: Partial<TransferInsert> = {},
): TransferInsert => {
  const n = txCounter++;
  return {
    id: `tx-${n}`,
    transactionHash: `0x${n.toString(16).padStart(64, "0")}`,
    daoId: "test-dao",
    tokenId: "token-1",
    amount: 100n,
    fromAccountId: ACCOUNT_A,
    toAccountId: ACCOUNT_B,
    timestamp: 1700000000n,
    logIndex: 0,
    ...overrides,
  };
};

describe("BalanceVariationsRepository", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: BalanceVariationsRepository;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    const fragments = new AccountBalanceQueryFragments(db);
    repository = new BalanceVariationsRepository(db, fragments);

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

  describe("getAccountBalanceVariations", () => {
    it("should return accounts with non-zero changes only", async () => {
      await db.insert(accountBalance).values([
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "token-1",
          balance: 1000n,
        }),
        createAccountBalance({
          accountId: ACCOUNT_B,
          tokenId: "token-1",
          balance: 500n,
        }),
      ]);
      await db.insert(transfer).values(
        createTransfer({
          fromAccountId: ACCOUNT_A,
          toAccountId: ACCOUNT_B,
          amount: 200n,
        }),
      );

      const result = await repository.getAccountBalanceVariations(
        undefined,
        undefined,
        10,
        0,
        "desc",
      );

      result.forEach((item) => {
        expect(item.absoluteChange).not.toBe(0n);
      });
    });

    it("should filter by timestamp range", async () => {
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: ACCOUNT_B,
          tokenId: "token-1",
          balance: 500n,
        }),
      );
      await db.insert(transfer).values([
        createTransfer({
          toAccountId: ACCOUNT_B,
          amount: 100n,
          timestamp: 1000n,
        }),
        createTransfer({
          toAccountId: ACCOUNT_B,
          amount: 200n,
          timestamp: 3000n,
        }),
      ]);

      const result = await repository.getAccountBalanceVariations(
        2000,
        4000,
        10,
        0,
        "desc",
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.absoluteChange).toBe(200n);
    });

    it("should filter by addresses", async () => {
      await db.insert(accountBalance).values([
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "token-1",
          balance: 1000n,
        }),
        createAccountBalance({
          accountId: ACCOUNT_B,
          tokenId: "token-1",
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
          amount: 200n,
        }),
      ]);

      const result = await repository.getAccountBalanceVariations(
        undefined,
        undefined,
        10,
        0,
        "desc",
        [ACCOUNT_A],
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.accountId).toBe(ACCOUNT_A);
    });

    it("should order by absolute change descending", async () => {
      await db.insert(accountBalance).values([
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "token-1",
          balance: 1000n,
        }),
        createAccountBalance({
          accountId: ACCOUNT_B,
          tokenId: "token-1",
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

      const result = await repository.getAccountBalanceVariations(
        undefined,
        undefined,
        10,
        0,
        "desc",
      );

      expect(result.length).toBeGreaterThanOrEqual(2);
      expect(
        Math.abs(Number(result[0]!.absoluteChange)),
      ).toBeGreaterThanOrEqual(Math.abs(Number(result[1]!.absoluteChange)));
    });

    it("should apply pagination", async () => {
      await db.insert(accountBalance).values([
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "token-1",
          balance: 1000n,
        }),
        createAccountBalance({
          accountId: ACCOUNT_B,
          tokenId: "token-1",
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

      const page1 = await repository.getAccountBalanceVariations(
        undefined,
        undefined,
        1,
        0,
        "desc",
      );
      const page2 = await repository.getAccountBalanceVariations(
        undefined,
        undefined,
        1,
        1,
        "desc",
      );

      expect(page1).toHaveLength(1);
      expect(page2).toHaveLength(1);
      expect(page1[0]!.accountId).not.toBe(page2[0]!.accountId);
    });

    it("should compute percentageChange", async () => {
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: ACCOUNT_B,
          tokenId: "token-1",
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

      const result = await repository.getAccountBalanceVariations(
        undefined,
        undefined,
        10,
        0,
        "desc",
      );

      const row = result.find((r) => r.accountId === ACCOUNT_B);
      expect(row).toBeDefined();
      expect(row!.percentageChange).toBe("20");
    });

    it("should return empty when no transfers exist", async () => {
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "token-1",
          balance: 1000n,
        }),
      );

      const result = await repository.getAccountBalanceVariations(
        undefined,
        undefined,
        10,
        0,
        "desc",
      );

      expect(result).toEqual([]);
    });
  });

  describe("getAccountBalanceVariationsByAccountId", () => {
    it("should return variation for a specific account", async () => {
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: ACCOUNT_B,
          tokenId: "token-1",
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

      const result = await repository.getAccountBalanceVariationsByAccountId(
        ACCOUNT_B,
        undefined,
        undefined,
      );

      expect(result).toBeDefined();
      expect(result!.accountId).toBe(ACCOUNT_B);
      expect(result!.absoluteChange).toBe(200n);
      expect(result!.currentBalance).toBe(1200n);
      expect(result!.previousBalance).toBe(1000n);
    });

    it("should return undefined when account has no variation", async () => {
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "token-1",
          balance: 1000n,
        }),
      );

      const result = await repository.getAccountBalanceVariationsByAccountId(
        ACCOUNT_A,
        undefined,
        undefined,
      );

      expect(result).toBeUndefined();
    });

    it("should return undefined for non-existent account", async () => {
      const result = await repository.getAccountBalanceVariationsByAccountId(
        ACCOUNT_A,
        undefined,
        undefined,
      );

      expect(result).toBeUndefined();
    });
  });
});
