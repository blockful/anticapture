import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { pushSchema } from "drizzle-kit/api";
import * as schema from "@/database/schema";
import { delegation } from "@/database/schema";
import { HistoricalDelegationsRepository } from "./historical";
import { Address } from "viem";

type DelegationInsert = typeof delegation.$inferInsert;

const delegator: Address = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";
const delegate1: Address = "0x1234567890123456789012345678901234567890";
const delegate2: Address = "0x9999999999999999999999999999999999999999";

const createDelegation = (
  overrides: Partial<DelegationInsert> = {},
): DelegationInsert => ({
  transactionHash: "0xdefault",
  daoId: "uni",
  delegateAccountId: delegate1,
  delegatorAccountId: delegator,
  delegatedValue: 1000000000000000000n,
  previousDelegate: null,
  timestamp: 1700000000n,
  logIndex: 0,
  ...overrides,
});

const fullDelegation = (overrides: Partial<DelegationInsert> = {}) => ({
  daoId: "uni",
  delegateAccountId: delegate1,
  delegatorAccountId: delegator,
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

describe("HistoricalDelegationsRepository", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: HistoricalDelegationsRepository;

  beforeAll(async () => {
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new HistoricalDelegationsRepository(db);

    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(delegation);
  });

  describe("getHistoricalDelegations", () => {
    it("should return items and totalCount", async () => {
      await db.insert(delegation).values([
        createDelegation({ transactionHash: "0xtx1", delegatedValue: 500n }),
        createDelegation({ transactionHash: "0xtx2", delegatedValue: 800n }),
      ]);

      const result = await repository.getHistoricalDelegations(
        delegator,
        "desc",
        0,
        10,
      );

      expect(result).toEqual({
        items: [
          fullDelegation({ transactionHash: "0xtx1", delegatedValue: 500n }),
          fullDelegation({ transactionHash: "0xtx2", delegatedValue: 800n }),
        ],
        totalCount: 2,
      });
    });

    it("should return empty when no data exists", async () => {
      const result = await repository.getHistoricalDelegations(
        delegator,
        "desc",
        0,
        10,
      );

      expect(result).toEqual({ items: [], totalCount: 0 });
    });

    it("should only return delegations for the specified delegator", async () => {
      await db.insert(delegation).values([
        createDelegation({
          transactionHash: "0xtx1",
          delegatorAccountId: delegator,
          delegatedValue: 500n,
        }),
        createDelegation({
          transactionHash: "0xtx2",
          delegatorAccountId: "0x8888888888888888888888888888888888888888",
          delegateAccountId: delegate2,
        }),
      ]);

      const result = await repository.getHistoricalDelegations(
        delegator,
        "desc",
        0,
        10,
      );

      expect(result).toEqual({
        items: [
          fullDelegation({
            transactionHash: "0xtx1",
            delegatedValue: 500n,
          }),
        ],
        totalCount: 1,
      });
    });

    it("should filter by fromValue (gte on timestamp)", async () => {
      await db.insert(delegation).values([
        createDelegation({ transactionHash: "0xtx1", timestamp: 1000n }),
        createDelegation({ transactionHash: "0xtx2", timestamp: 2000n }),
        createDelegation({ transactionHash: "0xtx3", timestamp: 3000n }),
      ]);

      const result = await repository.getHistoricalDelegations(
        delegator,
        "asc",
        0,
        10,
        2000n,
      );

      expect(result).toEqual({
        items: [
          fullDelegation({ transactionHash: "0xtx2", timestamp: 2000n }),
          fullDelegation({ transactionHash: "0xtx3", timestamp: 3000n }),
        ],
        totalCount: 2,
      });
    });

    it("should filter by toValue (lte on timestamp)", async () => {
      await db.insert(delegation).values([
        createDelegation({ transactionHash: "0xtx1", timestamp: 1000n }),
        createDelegation({ transactionHash: "0xtx2", timestamp: 2000n }),
        createDelegation({ transactionHash: "0xtx3", timestamp: 3000n }),
      ]);

      const result = await repository.getHistoricalDelegations(
        delegator,
        "asc",
        0,
        10,
        undefined,
        2000n,
      );

      expect(result).toEqual({
        items: [
          fullDelegation({ transactionHash: "0xtx1", timestamp: 1000n }),
          fullDelegation({ transactionHash: "0xtx2", timestamp: 2000n }),
        ],
        totalCount: 2,
      });
    });

    it("should filter by both fromValue and toValue", async () => {
      await db.insert(delegation).values([
        createDelegation({ transactionHash: "0xtx1", timestamp: 1000n }),
        createDelegation({ transactionHash: "0xtx2", timestamp: 2000n }),
        createDelegation({ transactionHash: "0xtx3", timestamp: 3000n }),
        createDelegation({ transactionHash: "0xtx4", timestamp: 4000n }),
      ]);

      const result = await repository.getHistoricalDelegations(
        delegator,
        "asc",
        0,
        10,
        2000n,
        3000n,
      );

      expect(result).toEqual({
        items: [
          fullDelegation({ transactionHash: "0xtx2", timestamp: 2000n }),
          fullDelegation({ transactionHash: "0xtx3", timestamp: 3000n }),
        ],
        totalCount: 2,
      });
    });

    it("should filter by delegateAddressIn", async () => {
      await db.insert(delegation).values([
        createDelegation({
          transactionHash: "0xtx1",
          delegateAccountId: delegate1,
        }),
        createDelegation({
          transactionHash: "0xtx2",
          delegateAccountId: delegate2,
        }),
        createDelegation({
          transactionHash: "0xtx3",
          delegateAccountId: "0x7777777777777777777777777777777777777777",
        }),
      ]);

      const result = await repository.getHistoricalDelegations(
        delegator,
        "desc",
        0,
        10,
        undefined,
        undefined,
        [delegate1, delegate2],
      );

      expect(result).toEqual({
        items: [
          fullDelegation({
            transactionHash: "0xtx1",
            delegateAccountId: delegate1,
          }),
          fullDelegation({
            transactionHash: "0xtx2",
            delegateAccountId: delegate2,
          }),
        ],
        totalCount: 2,
      });
    });

    it("should order by timestamp descending", async () => {
      await db.insert(delegation).values([
        createDelegation({ transactionHash: "0xtx1", timestamp: 1000n }),
        createDelegation({ transactionHash: "0xtx2", timestamp: 3000n }),
        createDelegation({ transactionHash: "0xtx3", timestamp: 2000n }),
      ]);

      const result = await repository.getHistoricalDelegations(
        delegator,
        "desc",
        0,
        10,
      );

      expect(result).toEqual({
        items: [
          fullDelegation({ transactionHash: "0xtx2", timestamp: 3000n }),
          fullDelegation({ transactionHash: "0xtx3", timestamp: 2000n }),
          fullDelegation({ transactionHash: "0xtx1", timestamp: 1000n }),
        ],
        totalCount: 3,
      });
    });

    it("should order by timestamp ascending", async () => {
      await db.insert(delegation).values([
        createDelegation({ transactionHash: "0xtx1", timestamp: 3000n }),
        createDelegation({ transactionHash: "0xtx2", timestamp: 1000n }),
        createDelegation({ transactionHash: "0xtx3", timestamp: 2000n }),
      ]);

      const result = await repository.getHistoricalDelegations(
        delegator,
        "asc",
        0,
        10,
      );

      expect(result).toEqual({
        items: [
          fullDelegation({ transactionHash: "0xtx2", timestamp: 1000n }),
          fullDelegation({ transactionHash: "0xtx3", timestamp: 2000n }),
          fullDelegation({ transactionHash: "0xtx1", timestamp: 3000n }),
        ],
        totalCount: 3,
      });
    });

    it("should apply pagination with skip", async () => {
      await db.insert(delegation).values([
        createDelegation({ transactionHash: "0xtx1", timestamp: 3000n }),
        createDelegation({ transactionHash: "0xtx2", timestamp: 2000n }),
        createDelegation({ transactionHash: "0xtx3", timestamp: 1000n }),
      ]);

      const result = await repository.getHistoricalDelegations(
        delegator,
        "desc",
        1,
        10,
      );

      expect(result).toEqual({
        items: [
          fullDelegation({ transactionHash: "0xtx2", timestamp: 2000n }),
          fullDelegation({ transactionHash: "0xtx3", timestamp: 1000n }),
        ],
        totalCount: 3,
      });
    });

    it("should apply pagination with limit", async () => {
      await db.insert(delegation).values([
        createDelegation({ transactionHash: "0xtx1", timestamp: 3000n }),
        createDelegation({ transactionHash: "0xtx2", timestamp: 2000n }),
        createDelegation({ transactionHash: "0xtx3", timestamp: 1000n }),
      ]);

      const result = await repository.getHistoricalDelegations(
        delegator,
        "desc",
        0,
        2,
      );

      expect(result).toEqual({
        items: [
          fullDelegation({ transactionHash: "0xtx1", timestamp: 3000n }),
          fullDelegation({ transactionHash: "0xtx2", timestamp: 2000n }),
        ],
        totalCount: 3,
      });
    });

    it("should return totalCount independent of pagination", async () => {
      await db.insert(delegation).values([
        createDelegation({ transactionHash: "0xtx1", timestamp: 5000n }),
        createDelegation({ transactionHash: "0xtx2", timestamp: 4000n }),
        createDelegation({ transactionHash: "0xtx3", timestamp: 3000n }),
        createDelegation({ transactionHash: "0xtx4", timestamp: 2000n }),
        createDelegation({ transactionHash: "0xtx5", timestamp: 1000n }),
      ]);

      const result = await repository.getHistoricalDelegations(
        delegator,
        "desc",
        2,
        2,
      );

      expect(result).toEqual({
        items: [
          fullDelegation({ transactionHash: "0xtx3", timestamp: 3000n }),
          fullDelegation({ transactionHash: "0xtx4", timestamp: 2000n }),
        ],
        totalCount: 5,
      });
    });

    it("should combine all filters together", async () => {
      await db.insert(delegation).values([
        createDelegation({
          transactionHash: "0xtx1",
          timestamp: 1000n,
          delegateAccountId: delegate1,
        }),
        createDelegation({
          transactionHash: "0xtx2",
          timestamp: 2000n,
          delegateAccountId: delegate1,
        }),
        createDelegation({
          transactionHash: "0xtx3",
          timestamp: 3000n,
          delegateAccountId: delegate2,
        }),
        createDelegation({
          transactionHash: "0xtx4",
          timestamp: 4000n,
          delegateAccountId: delegate1,
        }),
      ]);

      const result = await repository.getHistoricalDelegations(
        delegator,
        "asc",
        0,
        10,
        2000n,
        3000n,
        [delegate1],
      );

      expect(result).toEqual({
        items: [
          fullDelegation({
            transactionHash: "0xtx2",
            timestamp: 2000n,
            delegateAccountId: delegate1,
          }),
        ],
        totalCount: 1,
      });
    });
  });
});
