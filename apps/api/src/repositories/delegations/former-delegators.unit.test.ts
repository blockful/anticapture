import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address } from "viem";

import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import { delegation } from "@/database/schema";

import { FormerDelegatorsRepository } from "./former-delegators";

const DELEGATE: Address = "0x1111111111111111111111111111111111111111";
const OTHER_DELEGATE: Address = "0x9999999999999999999999999999999999999999";
const THIRD_DELEGATE: Address = "0x8888888888888888888888888888888888888888";
const DELEGATOR_A: Address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const DELEGATOR_B: Address = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const DELEGATOR_C: Address = "0xcccccccccccccccccccccccccccccccccccccccc";

type DelegationInsert = typeof delegation.$inferInsert;

let txCounter = 0;

const createDelegation = (
  overrides: Partial<DelegationInsert> = {},
): DelegationInsert => ({
  transactionHash: `0x${(txCounter++).toString(16).padStart(64, "0")}`,
  daoId: "UNI",
  delegateAccountId: DELEGATE,
  delegatorAccountId: DELEGATOR_A,
  delegatedValue: 0n,
  previousDelegate: null,
  timestamp: 1700000000n,
  logIndex: 0,
  ...overrides,
});

describe("FormerDelegatorsRepository", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: FormerDelegatorsRepository;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new FormerDelegatorsRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(delegation);
    txCounter = 0;
  });

  it("returns empty when no delegations exist", async () => {
    const result = await repository.getFormerDelegators(
      DELEGATE,
      0,
      10,
      "desc",
    );

    expect(result).toEqual({ items: [], totalCount: 0 });
  });

  it("excludes delegators still delegating to the address", async () => {
    await db.insert(delegation).values([
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegatedValue: 500n,
        timestamp: 1000n,
      }),
    ]);

    const result = await repository.getFormerDelegators(
      DELEGATE,
      0,
      10,
      "desc",
    );

    expect(result).toEqual({ items: [], totalCount: 0 });
  });

  it("excludes delegators that never delegated to the address", async () => {
    await db.insert(delegation).values([
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegateAccountId: OTHER_DELEGATE,
        timestamp: 1000n,
      }),
    ]);

    const result = await repository.getFormerDelegators(
      DELEGATE,
      0,
      10,
      "desc",
    );

    expect(result).toEqual({ items: [], totalCount: 0 });
  });

  it("returns a delegator that moved away with amount, stint and destination", async () => {
    await db.insert(delegation).values([
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegateAccountId: DELEGATE,
        delegatedValue: 500n,
        timestamp: 1000n,
      }),
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegateAccountId: OTHER_DELEGATE,
        previousDelegate: DELEGATE,
        delegatedValue: 500n,
        timestamp: 2000n,
      }),
    ]);

    const result = await repository.getFormerDelegators(
      DELEGATE,
      0,
      10,
      "desc",
    );

    expect(result).toEqual({
      items: [
        {
          delegatorAddress: DELEGATOR_A,
          amount: 500n,
          redelegatedAmount: 500n,
          startTimestamp: 1000n,
          endTimestamp: 2000n,
          redelegatedTo: OTHER_DELEGATE,
        },
      ],
      totalCount: 1,
    });
  });

  it("uses the last delegated value of the stint as the amount", async () => {
    await db.insert(delegation).values([
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegatedValue: 100n,
        timestamp: 1000n,
      }),
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegatedValue: 300n,
        timestamp: 2000n,
      }),
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegateAccountId: OTHER_DELEGATE,
        previousDelegate: DELEGATE,
        timestamp: 3000n,
      }),
    ]);

    const result = await repository.getFormerDelegators(
      DELEGATE,
      0,
      10,
      "desc",
    );

    expect(result.items).toEqual([
      {
        delegatorAddress: DELEGATOR_A,
        amount: 300n,
        redelegatedAmount: 0n,
        startTimestamp: 1000n,
        endTimestamp: 3000n,
        redelegatedTo: OTHER_DELEGATE,
      },
    ]);
  });

  it("sets redelegatedTo to null when the move-away event does not reference the address", async () => {
    await db.insert(delegation).values([
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegatedValue: 500n,
        timestamp: 1000n,
      }),
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegateAccountId: OTHER_DELEGATE,
        previousDelegate: null,
        timestamp: 2000n,
      }),
    ]);

    const result = await repository.getFormerDelegators(
      DELEGATE,
      0,
      10,
      "desc",
    );

    expect(result.items[0]?.redelegatedTo).toBeNull();
  });

  it("uses the most recent stint when the delegator came back and left again", async () => {
    await db.insert(delegation).values([
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegatedValue: 100n,
        timestamp: 1000n,
      }),
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegateAccountId: OTHER_DELEGATE,
        previousDelegate: DELEGATE,
        timestamp: 2000n,
      }),
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegateAccountId: DELEGATE,
        previousDelegate: OTHER_DELEGATE,
        delegatedValue: 700n,
        timestamp: 3000n,
      }),
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegateAccountId: THIRD_DELEGATE,
        previousDelegate: DELEGATE,
        timestamp: 4000n,
      }),
    ]);

    const result = await repository.getFormerDelegators(
      DELEGATE,
      0,
      10,
      "desc",
    );

    expect(result.items).toEqual([
      {
        delegatorAddress: DELEGATOR_A,
        amount: 700n,
        redelegatedAmount: 0n,
        startTimestamp: 3000n,
        endTimestamp: 4000n,
        redelegatedTo: THIRD_DELEGATE,
      },
    ]);
  });

  it("excludes delegators whose latest delegation returned to the address", async () => {
    await db.insert(delegation).values([
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        timestamp: 1000n,
      }),
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegateAccountId: OTHER_DELEGATE,
        previousDelegate: DELEGATE,
        timestamp: 2000n,
      }),
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegateAccountId: DELEGATE,
        previousDelegate: OTHER_DELEGATE,
        timestamp: 3000n,
      }),
    ]);

    const result = await repository.getFormerDelegators(
      DELEGATE,
      0,
      10,
      "desc",
    );

    expect(result).toEqual({ items: [], totalCount: 0 });
  });

  describe("ordering and pagination", () => {
    beforeEach(async () => {
      await db.insert(delegation).values([
        createDelegation({
          delegatorAccountId: DELEGATOR_A,
          delegatedValue: 100n,
          timestamp: 1000n,
        }),
        createDelegation({
          delegatorAccountId: DELEGATOR_A,
          delegateAccountId: OTHER_DELEGATE,
          previousDelegate: DELEGATE,
          timestamp: 4000n,
        }),
        createDelegation({
          delegatorAccountId: DELEGATOR_B,
          delegatedValue: 200n,
          timestamp: 2000n,
        }),
        createDelegation({
          delegatorAccountId: DELEGATOR_B,
          delegateAccountId: OTHER_DELEGATE,
          previousDelegate: DELEGATE,
          timestamp: 5000n,
        }),
        createDelegation({
          delegatorAccountId: DELEGATOR_C,
          delegatedValue: 300n,
          timestamp: 3000n,
        }),
        createDelegation({
          delegatorAccountId: DELEGATOR_C,
          delegateAccountId: OTHER_DELEGATE,
          previousDelegate: DELEGATE,
          timestamp: 6000n,
        }),
      ]);
    });

    it("orders by endTimestamp descending", async () => {
      const result = await repository.getFormerDelegators(
        DELEGATE,
        0,
        10,
        "desc",
      );

      expect(result.items.map((item) => item.delegatorAddress)).toEqual([
        DELEGATOR_C,
        DELEGATOR_B,
        DELEGATOR_A,
      ]);
      expect(result.totalCount).toBe(3);
    });

    it("orders by endTimestamp ascending", async () => {
      const result = await repository.getFormerDelegators(
        DELEGATE,
        0,
        10,
        "asc",
      );

      expect(result.items.map((item) => item.delegatorAddress)).toEqual([
        DELEGATOR_A,
        DELEGATOR_B,
        DELEGATOR_C,
      ]);
    });

    it("applies skip and limit while keeping totalCount", async () => {
      const result = await repository.getFormerDelegators(
        DELEGATE,
        1,
        1,
        "desc",
      );

      expect(result.items.map((item) => item.delegatorAddress)).toEqual([
        DELEGATOR_B,
      ]);
      expect(result.totalCount).toBe(3);
    });
  });
});
