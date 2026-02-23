import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { pushSchema } from "drizzle-kit/api";
import * as schema from "@/database/schema";
import { accountBalance, delegation } from "@/database/schema";
import { Address } from "viem";
import { DelegatorsRepository } from "./delegators";
import { DelegatorsSortOptions } from "@/services/delegations/delegators";

type AccountBalanceInsert = typeof accountBalance.$inferInsert;
type DelegationInsert = typeof delegation.$inferInsert;

const DELEGATE: Address = "0x1111111111111111111111111111111111111111";
const DELEGATOR_A: Address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const DELEGATOR_B: Address = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const DELEGATOR_C: Address = "0xcccccccccccccccccccccccccccccccccccccccc";
const OTHER_DELEGATE: Address = "0x9999999999999999999999999999999999999999";

let txCounter = 0;

const createAccountBalance = (
  overrides: Partial<AccountBalanceInsert> = {},
): AccountBalanceInsert => ({
  accountId: DELEGATOR_A,
  tokenId: `token-${txCounter++}`,
  balance: 1000000000000000000n,
  delegate: DELEGATE,
  ...overrides,
});

const createDelegation = (
  overrides: Partial<DelegationInsert> = {},
): DelegationInsert => ({
  transactionHash: `0x${(txCounter++).toString(16).padStart(64, "0")}`,
  daoId: "uni",
  delegateAccountId: DELEGATE,
  delegatorAccountId: DELEGATOR_A,
  delegatedValue: 0n,
  timestamp: 1700000000n,
  logIndex: 0,
  ...overrides,
});

const defaultSort = (
  overrides: Partial<DelegatorsSortOptions> = {},
): DelegatorsSortOptions => ({
  orderBy: "amount",
  orderDirection: "desc",
  ...overrides,
});

describe("DelegatorsRepository", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: DelegatorsRepository;

  beforeAll(async () => {
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new DelegatorsRepository(db);

    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(accountBalance);
    await db.delete(delegation);
    txCounter = 0;
  });

  describe("getDelegators", () => {
    it("should return items and totalCount", async () => {
      await db.insert(delegation).values([
        createDelegation({
          delegatorAccountId: DELEGATOR_A,
          timestamp: 1000n,
        }),
        createDelegation({
          delegatorAccountId: DELEGATOR_B,
          timestamp: 2000n,
        }),
      ]);
      await db.insert(accountBalance).values([
        createAccountBalance({ accountId: DELEGATOR_A, balance: 500n }),
        createAccountBalance({ accountId: DELEGATOR_B, balance: 1000n }),
      ]);

      const result = await repository.getDelegators(
        DELEGATE,
        0,
        10,
        defaultSort(),
      );

      expect(result).toEqual({
        items: [
          { delegatorAddress: DELEGATOR_B, amount: 1000n, timestamp: 2000n },
          { delegatorAddress: DELEGATOR_A, amount: 500n, timestamp: 1000n },
        ],
        totalCount: 2,
      });
    });

    it("should return empty when no data exists", async () => {
      const result = await repository.getDelegators(
        DELEGATE,
        0,
        10,
        defaultSort(),
      );

      expect(result).toEqual({ items: [], totalCount: 0 });
    });

    it("should only return delegators who delegate to the given address", async () => {
      await db.insert(delegation).values([
        createDelegation({
          delegatorAccountId: DELEGATOR_A,
          delegateAccountId: DELEGATE,
          timestamp: 1000n,
        }),
        createDelegation({
          delegatorAccountId: DELEGATOR_B,
          delegateAccountId: OTHER_DELEGATE,
        }),
      ]);
      await db.insert(accountBalance).values([
        createAccountBalance({
          accountId: DELEGATOR_A,
          balance: 500n,
          delegate: DELEGATE,
        }),
        createAccountBalance({
          accountId: DELEGATOR_B,
          delegate: OTHER_DELEGATE,
        }),
      ]);

      const result = await repository.getDelegators(
        DELEGATE,
        0,
        10,
        defaultSort(),
      );

      expect(result).toEqual({
        items: [
          { delegatorAddress: DELEGATOR_A, amount: 500n, timestamp: 1000n },
        ],
        totalCount: 1,
      });
    });

    it("should aggregate balances across multiple token entries", async () => {
      await db
        .insert(delegation)
        .values([
          createDelegation({
            delegatorAccountId: DELEGATOR_A,
            timestamp: 1000n,
          }),
        ]);
      await db.insert(accountBalance).values([
        createAccountBalance({
          accountId: DELEGATOR_A,
          tokenId: "token-a",
          balance: 1000n,
        }),
        createAccountBalance({
          accountId: DELEGATOR_A,
          tokenId: "token-b",
          balance: 2000n,
        }),
      ]);

      const result = await repository.getDelegators(
        DELEGATE,
        0,
        10,
        defaultSort(),
      );

      expect(result).toEqual({
        items: [
          { delegatorAddress: DELEGATOR_A, amount: 3000n, timestamp: 1000n },
        ],
        totalCount: 1,
      });
    });

    it("should include self-delegation", async () => {
      await db
        .insert(delegation)
        .values([
          createDelegation({
            delegatorAccountId: DELEGATE,
            delegateAccountId: DELEGATE,
            timestamp: 1000n,
          }),
        ]);
      await db.insert(accountBalance).values([
        createAccountBalance({
          accountId: DELEGATE,
          balance: 500n,
          delegate: DELEGATE,
        }),
      ]);

      const result = await repository.getDelegators(
        DELEGATE,
        0,
        10,
        defaultSort(),
      );

      expect(result).toEqual({
        items: [
          { delegatorAddress: DELEGATE, amount: 500n, timestamp: 1000n },
        ],
        totalCount: 1,
      });
    });

    it("should return the latest delegation timestamp per delegator", async () => {
      await db.insert(delegation).values([
        createDelegation({
          delegatorAccountId: DELEGATOR_A,
          timestamp: 1000n,
        }),
        createDelegation({
          delegatorAccountId: DELEGATOR_A,
          timestamp: 3000n,
        }),
        createDelegation({
          delegatorAccountId: DELEGATOR_A,
          timestamp: 2000n,
        }),
      ]);
      await db.insert(accountBalance).values([
        createAccountBalance({ accountId: DELEGATOR_A, balance: 500n }),
      ]);

      const result = await repository.getDelegators(
        DELEGATE,
        0,
        10,
        defaultSort(),
      );

      expect(result).toEqual({
        items: [
          { delegatorAddress: DELEGATOR_A, amount: 500n, timestamp: 3000n },
        ],
        totalCount: 1,
      });
    });

    it("should include a delegator with zero balance", async () => {
      await db
        .insert(delegation)
        .values([
          createDelegation({
            delegatorAccountId: DELEGATOR_A,
            timestamp: 1000n,
          }),
        ]);
      await db.insert(accountBalance).values([
        createAccountBalance({ accountId: DELEGATOR_A, balance: 0n }),
      ]);

      const result = await repository.getDelegators(
        DELEGATE,
        0,
        10,
        defaultSort(),
      );

      expect(result).toEqual({
        items: [
          { delegatorAddress: DELEGATOR_A, amount: 0n, timestamp: 1000n },
        ],
        totalCount: 1,
      });
    });

    describe("sorting", () => {
      beforeEach(async () => {
        await db.insert(delegation).values([
          createDelegation({
            delegatorAccountId: DELEGATOR_A,
            timestamp: 2000n,
          }),
          createDelegation({
            delegatorAccountId: DELEGATOR_B,
            timestamp: 1000n,
          }),
          createDelegation({
            delegatorAccountId: DELEGATOR_C,
            timestamp: 3000n,
          }),
        ]);
        await db.insert(accountBalance).values([
          createAccountBalance({
            accountId: DELEGATOR_A,
            balance: 200n,
          }),
          createAccountBalance({
            accountId: DELEGATOR_B,
            balance: 300n,
          }),
          createAccountBalance({
            accountId: DELEGATOR_C,
            balance: 100n,
          }),
        ]);
      });

      it("should order by amount descending", async () => {
        const result = await repository.getDelegators(
          DELEGATE,
          0,
          10,
          defaultSort({ orderBy: "amount", orderDirection: "desc" }),
        );

        expect(result).toEqual({
          items: [
            { delegatorAddress: DELEGATOR_B, amount: 300n, timestamp: 1000n },
            { delegatorAddress: DELEGATOR_A, amount: 200n, timestamp: 2000n },
            { delegatorAddress: DELEGATOR_C, amount: 100n, timestamp: 3000n },
          ],
          totalCount: 3,
        });
      });

      it("should order by amount ascending", async () => {
        const result = await repository.getDelegators(
          DELEGATE,
          0,
          10,
          defaultSort({ orderBy: "amount", orderDirection: "asc" }),
        );

        expect(result).toEqual({
          items: [
            { delegatorAddress: DELEGATOR_C, amount: 100n, timestamp: 3000n },
            { delegatorAddress: DELEGATOR_A, amount: 200n, timestamp: 2000n },
            { delegatorAddress: DELEGATOR_B, amount: 300n, timestamp: 1000n },
          ],
          totalCount: 3,
        });
      });

      it("should order by timestamp descending", async () => {
        const result = await repository.getDelegators(
          DELEGATE,
          0,
          10,
          defaultSort({ orderBy: "timestamp", orderDirection: "desc" }),
        );

        expect(result).toEqual({
          items: [
            { delegatorAddress: DELEGATOR_C, amount: 100n, timestamp: 3000n },
            { delegatorAddress: DELEGATOR_A, amount: 200n, timestamp: 2000n },
            { delegatorAddress: DELEGATOR_B, amount: 300n, timestamp: 1000n },
          ],
          totalCount: 3,
        });
      });

      it("should order by timestamp ascending", async () => {
        const result = await repository.getDelegators(
          DELEGATE,
          0,
          10,
          defaultSort({ orderBy: "timestamp", orderDirection: "asc" }),
        );

        expect(result).toEqual({
          items: [
            { delegatorAddress: DELEGATOR_B, amount: 300n, timestamp: 1000n },
            { delegatorAddress: DELEGATOR_A, amount: 200n, timestamp: 2000n },
            { delegatorAddress: DELEGATOR_C, amount: 100n, timestamp: 3000n },
          ],
          totalCount: 3,
        });
      });
    });

    describe("pagination", () => {
      beforeEach(async () => {
        await db.insert(delegation).values([
          createDelegation({
            delegatorAccountId: DELEGATOR_A,
            timestamp: 3000n,
          }),
          createDelegation({
            delegatorAccountId: DELEGATOR_B,
            timestamp: 2000n,
          }),
          createDelegation({
            delegatorAccountId: DELEGATOR_C,
            timestamp: 1000n,
          }),
        ]);
        await db.insert(accountBalance).values([
          createAccountBalance({
            accountId: DELEGATOR_A,
            balance: 300n,
          }),
          createAccountBalance({
            accountId: DELEGATOR_B,
            balance: 200n,
          }),
          createAccountBalance({
            accountId: DELEGATOR_C,
            balance: 100n,
          }),
        ]);
      });

      it("should apply skip", async () => {
        const result = await repository.getDelegators(
          DELEGATE,
          1,
          10,
          defaultSort(),
        );

        expect(result).toEqual({
          items: [
            { delegatorAddress: DELEGATOR_B, amount: 200n, timestamp: 2000n },
            { delegatorAddress: DELEGATOR_C, amount: 100n, timestamp: 1000n },
          ],
          totalCount: 3,
        });
      });

      it("should apply limit", async () => {
        const result = await repository.getDelegators(
          DELEGATE,
          0,
          2,
          defaultSort(),
        );

        expect(result).toEqual({
          items: [
            { delegatorAddress: DELEGATOR_A, amount: 300n, timestamp: 3000n },
            { delegatorAddress: DELEGATOR_B, amount: 200n, timestamp: 2000n },
          ],
          totalCount: 3,
        });
      });

      it("should return totalCount independent of pagination", async () => {
        const result = await repository.getDelegators(
          DELEGATE,
          1,
          1,
          defaultSort(),
        );

        expect(result).toEqual({
          items: [
            { delegatorAddress: DELEGATOR_B, amount: 200n, timestamp: 2000n },
          ],
          totalCount: 3,
        });
      });
    });
  });
});
