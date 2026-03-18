import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address } from "viem";

import { accountBalance, transfer } from "@/database/schema";
import * as schema from "@/database/schema";
import { Filter } from "@/mappers/account-balance/general";

import { AccountInteractionsRepository } from "./interactions";

type AccountBalanceInsert = typeof accountBalance.$inferInsert;
type TransferInsert = typeof transfer.$inferInsert;

const ACCOUNT_A: Address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const ACCOUNT_B: Address = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const ACCOUNT_C: Address = "0xcccccccccccccccccccccccccccccccccccccccc";

const NO_FILTER: Filter = {};

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

describe("AccountInteractionsRepository", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: AccountInteractionsRepository;

  beforeAll(async () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new AccountInteractionsRepository(db);

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

  describe("getAccountInteractions", () => {
    it("should aggregate incoming and outgoing transfers per counterparty", async () => {
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
          fromAccountId: ACCOUNT_A,
          toAccountId: ACCOUNT_B,
          amount: 200n,
        }),
        createTransfer({
          fromAccountId: ACCOUNT_B,
          toAccountId: ACCOUNT_A,
          amount: 50n,
        }),
      ]);

      const result = await repository.getAccountInteractions(
        ACCOUNT_A,
        undefined,
        undefined,
        10,
        0,
        "volume",
        "desc",
        NO_FILTER,
      );

      expect(result.interactionCount).toBeGreaterThanOrEqual(1);
      const interaction = result.interactions.find(
        (i) => i.accountId === ACCOUNT_B,
      );
      expect(interaction).toBeDefined();
      expect(interaction!.totalVolume).toBeGreaterThan(0n);
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
        NO_FILTER,
      );

      const selfInteraction = result.interactions.find(
        (i) => i.accountId === ACCOUNT_A,
      );
      expect(selfInteraction).toBeUndefined();
    });

    it("should filter by timestamp range", async () => {
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
          fromAccountId: ACCOUNT_A,
          toAccountId: ACCOUNT_B,
          amount: 100n,
          timestamp: 1000n,
        }),
        createTransfer({
          fromAccountId: ACCOUNT_A,
          toAccountId: ACCOUNT_B,
          amount: 200n,
          timestamp: 3000n,
        }),
      ]);

      const result = await repository.getAccountInteractions(
        ACCOUNT_A,
        2000,
        4000,
        10,
        0,
        "volume",
        "desc",
        NO_FILTER,
      );

      expect(result.interactionCount).toBe(1);
    });

    it("should filter by address", async () => {
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
          amount: 200n,
        }),
        createTransfer({
          fromAccountId: ACCOUNT_A,
          toAccountId: ACCOUNT_C,
          amount: 100n,
        }),
      ]);

      const result = await repository.getAccountInteractions(
        ACCOUNT_A,
        undefined,
        undefined,
        10,
        0,
        "volume",
        "desc",
        { address: ACCOUNT_B },
      );

      expect(result.interactions.every((i) => i.accountId === ACCOUNT_B)).toBe(
        true,
      );
    });

    it("should order by volume descending", async () => {
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

      const result = await repository.getAccountInteractions(
        ACCOUNT_A,
        undefined,
        undefined,
        10,
        0,
        "volume",
        "desc",
        NO_FILTER,
      );

      if (result.interactions.length >= 2) {
        expect(result.interactions[0]!.totalVolume).toBeGreaterThanOrEqual(
          result.interactions[1]!.totalVolume,
        );
      }
    });

    it("should order by count", async () => {
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
          amount: 100n,
        }),
        createTransfer({
          fromAccountId: ACCOUNT_A,
          toAccountId: ACCOUNT_B,
          amount: 100n,
        }),
        createTransfer({
          fromAccountId: ACCOUNT_A,
          toAccountId: ACCOUNT_C,
          amount: 500n,
        }),
      ]);

      const result = await repository.getAccountInteractions(
        ACCOUNT_A,
        undefined,
        undefined,
        10,
        0,
        "count",
        "desc",
        NO_FILTER,
      );

      if (result.interactions.length >= 2) {
        expect(result.interactions[0]!.transferCount).toBeGreaterThanOrEqual(
          result.interactions[1]!.transferCount,
        );
      }
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
        NO_FILTER,
      );
      const page2 = await repository.getAccountInteractions(
        ACCOUNT_A,
        undefined,
        undefined,
        1,
        1,
        "volume",
        "desc",
        NO_FILTER,
      );

      expect(page1.interactions).toHaveLength(1);
      expect(page2.interactions).toHaveLength(1);
      expect(page1.interactions[0]!.accountId).not.toBe(
        page2.interactions[0]!.accountId,
      );
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
        NO_FILTER,
      );

      expect(result.interactionCount).toBe(0);
      expect(result.interactions).toEqual([]);
    });

    it("should compute totalVolume and transferCount", async () => {
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
          fromAccountId: ACCOUNT_A,
          toAccountId: ACCOUNT_B,
          amount: 200n,
        }),
        createTransfer({
          fromAccountId: ACCOUNT_B,
          toAccountId: ACCOUNT_A,
          amount: 100n,
        }),
      ]);

      const result = await repository.getAccountInteractions(
        ACCOUNT_A,
        undefined,
        undefined,
        10,
        0,
        "volume",
        "desc",
        NO_FILTER,
      );

      const interaction = result.interactions.find(
        (i) => i.accountId === ACCOUNT_B,
      );
      expect(interaction).toBeDefined();
      expect(interaction!.transferCount).toBe(2n);
      expect(interaction!.totalVolume).toBe(300n);
    });
  });
});
