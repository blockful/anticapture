import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { Address } from "viem";

import { accountBalance, transfer } from "@/database/schema";
import * as schema from "@/database/schema";

import { AccountBalanceQueryFragments } from "./common";

type AccountBalanceInsert = typeof accountBalance.$inferInsert;
type TransferInsert = typeof transfer.$inferInsert;

const ACCOUNT_A: Address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const ACCOUNT_B: Address = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";

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

describe("AccountBalanceQueryFragments", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let fragments: AccountBalanceQueryFragments;

  beforeAll(async () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    fragments = new AccountBalanceQueryFragments(db);

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

  describe("variationCTE", () => {
    it("should return positive toChange for incoming transfers", async () => {
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: ACCOUNT_B,
          tokenId: "token-1",
          balance: 500n,
        }),
      );
      await db.insert(transfer).values(
        createTransfer({
          fromAccountId: ACCOUNT_A,
          toAccountId: ACCOUNT_B,
          amount: 200n,
        }),
      );

      const cte = fragments.variationCTE(undefined, undefined);
      const result = await db.select().from(cte);

      const row = result.find((r) => r.accountId === ACCOUNT_B);
      expect(row).toBeDefined();
      expect(BigInt(row!.toChange)).toBe(200n);
    });

    it("should return negative fromChange for outgoing transfers", async () => {
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "token-1",
          balance: 500n,
        }),
      );
      await db.insert(transfer).values(
        createTransfer({
          fromAccountId: ACCOUNT_A,
          toAccountId: ACCOUNT_B,
          amount: 200n,
        }),
      );

      const cte = fragments.variationCTE(undefined, undefined);
      const result = await db.select().from(cte);

      const row = result.find((r) => r.accountId === ACCOUNT_A);
      expect(row).toBeDefined();
      expect(BigInt(row!.fromChange)).toBe(-200n);
    });

    it("should scope transfers by fromTimestamp", async () => {
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
          timestamp: 2000n,
        }),
      ]);

      const cte = fragments.variationCTE(1500, undefined);
      const result = await db.select().from(cte);

      const row = result.find((r) => r.accountId === ACCOUNT_B);
      expect(BigInt(row!.toChange)).toBe(200n);
    });

    it("should scope transfers by toTimestamp", async () => {
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
          timestamp: 2000n,
        }),
      ]);

      const cte = fragments.variationCTE(undefined, 1500);
      const result = await db.select().from(cte);

      const row = result.find((r) => r.accountId === ACCOUNT_B);
      expect(BigInt(row!.toChange)).toBe(100n);
    });

    it("should return zero changes when no transfers exist", async () => {
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: ACCOUNT_A,
          tokenId: "token-1",
          balance: 500n,
        }),
      );

      const cte = fragments.variationCTE(undefined, undefined);
      const result = await db.select().from(cte);

      expect(result).toHaveLength(1);
      expect(BigInt(result[0]!.fromChange)).toBe(0n);
      expect(BigInt(result[0]!.toChange)).toBe(0n);
    });

    it("should handle multiple accounts", async () => {
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
          amount: 300n,
        }),
      );

      const cte = fragments.variationCTE(undefined, undefined);
      const result = await db.select().from(cte);

      const rowA = result.find((r) => r.accountId === ACCOUNT_A);
      const rowB = result.find((r) => r.accountId === ACCOUNT_B);
      expect(BigInt(rowA!.fromChange)).toBe(-300n);
      expect(BigInt(rowB!.toChange)).toBe(300n);
    });

    it("should apply additional SQL filter", async () => {
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

      const filter = sql`${accountBalance.accountId} = ${ACCOUNT_A}`;
      const cte = fragments.variationCTE(undefined, undefined, filter);
      const result = await db.select().from(cte);

      expect(result).toHaveLength(1);
      expect(result[0]!.accountId).toBe(ACCOUNT_A);
    });
  });
});
