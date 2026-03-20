import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address, getAddress } from "viem";

import type { Drizzle } from "@/database";
import { accountBalance, transfer } from "@/database/schema";
import * as schema from "@/database/schema";
import { AmountFilter } from "@/mappers";
import { Filter } from "@/mappers/account-balance/general";

import { AAVEAccountBalanceRepository } from "./aave";
import { AccountBalanceQueryFragments } from "./common";

type AccountBalanceInsert = typeof accountBalance.$inferInsert;
type TransferInsert = typeof transfer.$inferInsert;

const ACCOUNT_A: Address = "0xaAaAaAaaAaAaAaaAaAAAAAAAAaaaAaAaAaaAaaAa";
const ACCOUNT_B: Address = "0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB";
const ACCOUNT_C: Address = "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC";
const DELEGATE_A: Address = "0xdDdDddDdDdddDDddDDddDDDDdDdDDdDDdDDDDDDd";

const NO_FILTER: AmountFilter = { minAmount: undefined, maxAmount: undefined };
const NO_INTERACTION_FILTER: Filter = {};

let txCounter = 0;

const createAccountBalance = (
  overrides: Partial<AccountBalanceInsert> = {},
): AccountBalanceInsert => ({
  accountId: ACCOUNT_A,
  tokenId: `token-${txCounter++}`,
  balance: 1000n,
  ...overrides,
});

const createTransfer = (
  overrides: Partial<TransferInsert> = {},
): TransferInsert => ({
  transactionHash: `0x${(txCounter++).toString(16).padStart(64, "0")}`,
  daoId: "test-dao",
  tokenId: "token-1",
  amount: 100n,
  fromAccountId: ACCOUNT_A,
  toAccountId: ACCOUNT_B,
  timestamp: 1700000000n,
  logIndex: 0,
  ...overrides,
});

describe("AAVEAccountBalanceRepository", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: AAVEAccountBalanceRepository;

  beforeAll(async () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    const fragments = new AccountBalanceQueryFragments(db);
    repository = new AAVEAccountBalanceRepository(db, fragments);

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
      expect(result.totalCount).toBe(2n);
    });

    it("should filter by addresses", async () => {
      await db
        .insert(accountBalance)
        .values([
          createAccountBalance({ accountId: ACCOUNT_A }),
          createAccountBalance({ accountId: ACCOUNT_B }),
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
    });

    it("should filter by delegates", async () => {
      await db
        .insert(accountBalance)
        .values([
          createAccountBalance({ accountId: ACCOUNT_A, delegate: DELEGATE_A }),
          createAccountBalance({ accountId: ACCOUNT_B }),
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
      expect(result.items[0]!.delegate).toBe(DELEGATE_A);
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
    });
  });

  describe("getAccountBalance", () => {
    it("should return a single account balance", async () => {
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "token-1",
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
    it("should aggregate balance across multiple tokens (SUM)", async () => {
      await db.insert(accountBalance).values([
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "aToken",
          balance: 300n,
        }),
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "sToken",
          balance: 200n,
        }),
      ]);

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

      expect(result.items).toHaveLength(1);
      expect(BigInt(result.items[0]!.currentBalance)).toBe(500n);
    });

    it("should return totalCount based on distinct accounts", async () => {
      await db.insert(accountBalance).values([
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "aToken",
          balance: 300n,
        }),
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "sToken",
          balance: 200n,
        }),
        createAccountBalance({
          accountId: ACCOUNT_B,
          tokenId: "aToken",
          balance: 100n,
        }),
      ]);

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

      expect(result.totalCount).toBe(2);
    });

    it("should include variation data", async () => {
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
      expect(row!.absoluteChange).toBe(200n);
    });

    it("should order by balance", async () => {
      await db.insert(accountBalance).values([
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "token-1",
          balance: 300n,
        }),
        createAccountBalance({
          accountId: ACCOUNT_B,
          tokenId: "token-1",
          balance: 800n,
        }),
      ]);

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

      expect(BigInt(result.items[0]!.currentBalance)).toBeGreaterThanOrEqual(
        BigInt(result.items[1]!.currentBalance),
      );
    });

    it("should apply pagination", async () => {
      await db.insert(accountBalance).values([
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "token-1",
          balance: 300n,
        }),
        createAccountBalance({
          accountId: ACCOUNT_B,
          tokenId: "token-1",
          balance: 200n,
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

    it("should use getAddress for tokenId and delegate", async () => {
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "token-1",
          delegate: ACCOUNT_A,
          balance: 300n,
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

      expect(result.items[0]!.tokenId).toBe(getAddress(ACCOUNT_A));
      expect(result.items[0]!.delegate).toBe(getAddress(ACCOUNT_A));
    });
  });

  describe("getAccountBalanceWithVariation", () => {
    it("should return aggregated balance for a single account", async () => {
      await db.insert(accountBalance).values([
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "aToken",
          balance: 300n,
        }),
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "sToken",
          balance: 200n,
        }),
      ]);

      const result = await repository.getAccountBalanceWithVariation(
        ACCOUNT_A,
        0,
        2000000000,
      );

      expect(result).toBeDefined();
      expect(result!.currentBalance).toBe(500n);
    });

    it("should return undefined for non-existent account", async () => {
      const result = await repository.getAccountBalanceWithVariation(
        ACCOUNT_A,
        0,
        2000000000,
      );

      expect(result).toBeUndefined();
    });

    it("should include variation data", async () => {
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "token-1",
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
      expect(result!.absoluteChange).toBe(200n);
    });
  });

  describe("getAccountInteractions", () => {
    it("should aggregate interactions with GROUP BY for multi-token accounts", async () => {
      await db.insert(accountBalance).values([
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "aToken",
          balance: 500n,
        }),
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "sToken",
          balance: 300n,
        }),
        createAccountBalance({
          accountId: ACCOUNT_B,
          tokenId: "aToken",
          balance: 200n,
        }),
      ]);
      await db.insert(transfer).values(
        createTransfer({
          fromAccountId: ACCOUNT_A,
          toAccountId: ACCOUNT_B,
          amount: 100n,
        }),
      );

      const result = await repository.getAccountInteractions(
        ACCOUNT_A,
        undefined,
        undefined,
        10,
        0,
        "volume",
        "desc",
        NO_INTERACTION_FILTER,
      );

      expect(result.interactionCount).toBeGreaterThanOrEqual(1);
    });

    it("should exclude self from interactions", async () => {
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

      const result = await repository.getAccountInteractions(
        ACCOUNT_A,
        undefined,
        undefined,
        10,
        0,
        "volume",
        "desc",
        NO_INTERACTION_FILTER,
      );

      const selfInteraction = result.interactions.find(
        (i) => i.accountId === ACCOUNT_A,
      );
      expect(selfInteraction).toBeUndefined();
    });

    it("should return empty when no interactions exist", async () => {
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "token-1",
          balance: 1000n,
        }),
      );

      const result = await repository.getAccountInteractions(
        ACCOUNT_A,
        undefined,
        undefined,
        10,
        0,
        "volume",
        "desc",
        NO_INTERACTION_FILTER,
      );

      expect(result.interactionCount).toBe(0);
      expect(result.interactions).toEqual([]);
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
        createAccountBalance({
          accountId: ACCOUNT_C,
          tokenId: "token-1",
          balance: 300n,
        }),
      ]);
      await db.insert(transfer).values([
        createTransfer({
          fromAccountId: ACCOUNT_A,
          toAccountId: ACCOUNT_B,
          amount: 500n,
        }),
        createTransfer({
          fromAccountId: ACCOUNT_A,
          toAccountId: ACCOUNT_C,
          amount: 100n,
        }),
      ]);

      const page1 = await repository.getAccountInteractions(
        ACCOUNT_A,
        undefined,
        undefined,
        1,
        0,
        "volume",
        "desc",
        NO_INTERACTION_FILTER,
      );
      const page2 = await repository.getAccountInteractions(
        ACCOUNT_A,
        undefined,
        undefined,
        1,
        1,
        "volume",
        "desc",
        NO_INTERACTION_FILTER,
      );

      expect(page1.interactions).toHaveLength(1);
      expect(page2.interactions).toHaveLength(1);
    });
  });
});
