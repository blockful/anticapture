import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address } from "viem";

import * as schema from "@/database/schema";
import { delegation } from "@/database/schema";

import { DelegationsRepository } from "./general";

type DelegationInsert = typeof delegation.$inferInsert;

const delegate: Address = "0x1234567890123456789012345678901234567890";

const createDelegation = (
  overrides: Partial<DelegationInsert> = {},
): DelegationInsert => ({
  transactionHash: "0xdefault",
  daoId: "uni",
  delegateAccountId: delegate,
  delegatorAccountId: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  delegatedValue: 1000000000000000000n,
  previousDelegate: null,
  timestamp: 1700000000n,
  logIndex: 0,
  ...overrides,
});

const fullDelegation = (overrides: Partial<DelegationInsert> = {}) => ({
  daoId: "uni",
  delegateAccountId: delegate,
  delegatorAccountId: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd",
  delegatedValue: 1000000000000000000n,
  previousDelegate: null,
  timestamp: 1700000000n,
  logIndex: 0,
  isCex: false,
  isDex: false,
  isLending: false,
  isTotal: false,
  ...overrides,
});

describe("DelegationsRepository", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: DelegationsRepository;

  beforeAll(async () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new DelegationsRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(delegation);
  });

  describe("getDelegations", () => {
    it("should return delegations for the given delegate address", async () => {
      await db.insert(delegation).values([
        createDelegation({
          transactionHash: "0xtx1",
          delegatorAccountId: "0x1111111111111111111111111111111111111111",
          delegatedValue: 500n,
          timestamp: 1700001000n,
        }),
        createDelegation({
          transactionHash: "0xtx2",
          delegatorAccountId: "0x2222222222222222222222222222222222222222",
          delegatedValue: 800n,
          timestamp: 1700002000n,
        }),
      ]);

      const result = await repository.getDelegations(delegate, {
        orderBy: "timestamp",
        orderDirection: "desc",
      });

      expect(result).toEqual([
        fullDelegation({
          transactionHash: "0xtx2",
          delegatorAccountId: "0x2222222222222222222222222222222222222222",
          delegatedValue: 800n,
          timestamp: 1700002000n,
        }),
        fullDelegation({
          transactionHash: "0xtx1",
          delegatorAccountId: "0x1111111111111111111111111111111111111111",
          delegatedValue: 500n,
          timestamp: 1700001000n,
        }),
      ]);
    });

    it("should return empty when no delegations exist", async () => {
      const result = await repository.getDelegations(delegate, {
        orderBy: "timestamp",
        orderDirection: "desc",
      });

      expect(result).toEqual([]);
    });

    it("should only return delegations for the specified delegate", async () => {
      await db.insert(delegation).values([
        createDelegation({
          transactionHash: "0xtx1",
          delegateAccountId: delegate,
          delegatorAccountId: "0x1111111111111111111111111111111111111111",
        }),
        createDelegation({
          transactionHash: "0xtx2",
          delegateAccountId: "0x9999999999999999999999999999999999999999",
          delegatorAccountId: "0x8888888888888888888888888888888888888888",
        }),
      ]);

      const result = await repository.getDelegations(delegate, {
        orderBy: "timestamp",
        orderDirection: "desc",
      });

      expect(result).toEqual([
        fullDelegation({
          transactionHash: "0xtx1",
          delegatorAccountId: "0x1111111111111111111111111111111111111111",
        }),
      ]);
    });

    it("should order by timestamp descending", async () => {
      await db.insert(delegation).values([
        createDelegation({
          transactionHash: "0xtx1",
          delegatorAccountId: "0x1111111111111111111111111111111111111111",
          timestamp: 1000n,
        }),
        createDelegation({
          transactionHash: "0xtx2",
          delegatorAccountId: "0x2222222222222222222222222222222222222222",
          timestamp: 3000n,
        }),
        createDelegation({
          transactionHash: "0xtx3",
          delegatorAccountId: "0x3333333333333333333333333333333333333333",
          timestamp: 2000n,
        }),
      ]);

      const result = await repository.getDelegations(delegate, {
        orderBy: "timestamp",
        orderDirection: "desc",
      });

      expect(result).toEqual([
        fullDelegation({
          transactionHash: "0xtx2",
          delegatorAccountId: "0x2222222222222222222222222222222222222222",
          timestamp: 3000n,
        }),
        fullDelegation({
          transactionHash: "0xtx3",
          delegatorAccountId: "0x3333333333333333333333333333333333333333",
          timestamp: 2000n,
        }),
        fullDelegation({
          transactionHash: "0xtx1",
          delegatorAccountId: "0x1111111111111111111111111111111111111111",
          timestamp: 1000n,
        }),
      ]);
    });

    it("should order by timestamp ascending", async () => {
      await db.insert(delegation).values([
        createDelegation({
          transactionHash: "0xtx1",
          delegatorAccountId: "0x1111111111111111111111111111111111111111",
          timestamp: 3000n,
        }),
        createDelegation({
          transactionHash: "0xtx2",
          delegatorAccountId: "0x2222222222222222222222222222222222222222",
          timestamp: 1000n,
        }),
        createDelegation({
          transactionHash: "0xtx3",
          delegatorAccountId: "0x3333333333333333333333333333333333333333",
          timestamp: 2000n,
        }),
      ]);

      const result = await repository.getDelegations(delegate, {
        orderBy: "timestamp",
        orderDirection: "asc",
      });

      expect(result).toEqual([
        fullDelegation({
          transactionHash: "0xtx2",
          delegatorAccountId: "0x2222222222222222222222222222222222222222",
          timestamp: 1000n,
        }),
        fullDelegation({
          transactionHash: "0xtx3",
          delegatorAccountId: "0x3333333333333333333333333333333333333333",
          timestamp: 2000n,
        }),
        fullDelegation({
          transactionHash: "0xtx1",
          delegatorAccountId: "0x1111111111111111111111111111111111111111",
          timestamp: 3000n,
        }),
      ]);
    });

    it("should order by amount (delegatedValue) descending", async () => {
      await db.insert(delegation).values([
        createDelegation({
          transactionHash: "0xtx1",
          delegatorAccountId: "0x1111111111111111111111111111111111111111",
          delegatedValue: 100n,
        }),
        createDelegation({
          transactionHash: "0xtx2",
          delegatorAccountId: "0x2222222222222222222222222222222222222222",
          delegatedValue: 300n,
        }),
        createDelegation({
          transactionHash: "0xtx3",
          delegatorAccountId: "0x3333333333333333333333333333333333333333",
          delegatedValue: 200n,
        }),
      ]);

      const result = await repository.getDelegations(delegate, {
        orderBy: "amount",
        orderDirection: "desc",
      });

      expect(result).toEqual([
        fullDelegation({
          transactionHash: "0xtx2",
          delegatorAccountId: "0x2222222222222222222222222222222222222222",
          delegatedValue: 300n,
        }),
        fullDelegation({
          transactionHash: "0xtx3",
          delegatorAccountId: "0x3333333333333333333333333333333333333333",
          delegatedValue: 200n,
        }),
        fullDelegation({
          transactionHash: "0xtx1",
          delegatorAccountId: "0x1111111111111111111111111111111111111111",
          delegatedValue: 100n,
        }),
      ]);
    });

    it("should order by amount (delegatedValue) ascending", async () => {
      await db.insert(delegation).values([
        createDelegation({
          transactionHash: "0xtx1",
          delegatorAccountId: "0x1111111111111111111111111111111111111111",
          delegatedValue: 300n,
        }),
        createDelegation({
          transactionHash: "0xtx2",
          delegatorAccountId: "0x2222222222222222222222222222222222222222",
          delegatedValue: 100n,
        }),
        createDelegation({
          transactionHash: "0xtx3",
          delegatorAccountId: "0x3333333333333333333333333333333333333333",
          delegatedValue: 200n,
        }),
      ]);

      const result = await repository.getDelegations(delegate, {
        orderBy: "amount",
        orderDirection: "asc",
      });

      expect(result).toEqual([
        fullDelegation({
          transactionHash: "0xtx2",
          delegatorAccountId: "0x2222222222222222222222222222222222222222",
          delegatedValue: 100n,
        }),
        fullDelegation({
          transactionHash: "0xtx3",
          delegatorAccountId: "0x3333333333333333333333333333333333333333",
          delegatedValue: 200n,
        }),
        fullDelegation({
          transactionHash: "0xtx1",
          delegatorAccountId: "0x1111111111111111111111111111111111111111",
          delegatedValue: 300n,
        }),
      ]);
    });

    it("should use logIndex as secondary sort descending", async () => {
      await db.insert(delegation).values([
        createDelegation({
          transactionHash: "0xtx1",
          delegatorAccountId: "0x1111111111111111111111111111111111111111",
          timestamp: 1000n,
          logIndex: 1,
        }),
        createDelegation({
          transactionHash: "0xtx2",
          delegatorAccountId: "0x2222222222222222222222222222222222222222",
          timestamp: 1000n,
          logIndex: 3,
        }),
        createDelegation({
          transactionHash: "0xtx3",
          delegatorAccountId: "0x3333333333333333333333333333333333333333",
          timestamp: 1000n,
          logIndex: 2,
        }),
      ]);

      const result = await repository.getDelegations(delegate, {
        orderBy: "timestamp",
        orderDirection: "desc",
      });

      expect(result).toEqual([
        fullDelegation({
          transactionHash: "0xtx2",
          delegatorAccountId: "0x2222222222222222222222222222222222222222",
          timestamp: 1000n,
          logIndex: 3,
        }),
        fullDelegation({
          transactionHash: "0xtx3",
          delegatorAccountId: "0x3333333333333333333333333333333333333333",
          timestamp: 1000n,
          logIndex: 2,
        }),
        fullDelegation({
          transactionHash: "0xtx1",
          delegatorAccountId: "0x1111111111111111111111111111111111111111",
          timestamp: 1000n,
          logIndex: 1,
        }),
      ]);
    });
  });
});
