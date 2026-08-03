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

  it("takes the share from the last event of the stint, not the first", async () => {
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
        delegatedValue: 300n,
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
        redelegatedAmount: 300n,
        startTimestamp: 1000n,
        endTimestamp: 3000n,
        redelegatedTo: OTHER_DELEGATE,
      },
    ]);
  });

  // Balances that move while the delegation stands write no `delegations` row,
  // so the value stored on the last event is stale by the time of the move away
  // and only the share it represents can be carried forward.
  it("reports the balance at the move away when it grew while delegated", async () => {
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
        delegatedValue: 1000n,
        timestamp: 2000n,
      }),
    ]);

    const result = await repository.getFormerDelegators(
      DELEGATE,
      0,
      10,
      "desc",
    );

    expect(result.items[0]).toMatchObject({
      amount: 1000n,
      redelegatedAmount: 1000n,
    });
  });

  it("reports the balance at the move away when it shrank while delegated", async () => {
    await db.insert(delegation).values([
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegatedValue: 1000n,
        timestamp: 1000n,
      }),
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegateAccountId: OTHER_DELEGATE,
        previousDelegate: DELEGATE,
        delegatedValue: 100n,
        timestamp: 2000n,
      }),
    ]);

    const result = await repository.getFormerDelegators(
      DELEGATE,
      0,
      10,
      "desc",
    );

    expect(result.items[0]).toMatchObject({
      amount: 100n,
      redelegatedAmount: 100n,
    });
  });

  it("reports no loss when the delegator emptied the balance before moving away", async () => {
    await db.insert(delegation).values([
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegatedValue: 500n,
        timestamp: 1000n,
      }),
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegateAccountId: OTHER_DELEGATE,
        previousDelegate: DELEGATE,
        delegatedValue: 0n,
        timestamp: 2000n,
      }),
    ]);

    const result = await repository.getFormerDelegators(
      DELEGATE,
      0,
      10,
      "desc",
    );

    expect(result.items[0]).toMatchObject({
      amount: 0n,
      redelegatedAmount: 0n,
    });
  });

  it("reports no loss when the delegator held nothing during the stint", async () => {
    await db.insert(delegation).values([
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegatedValue: 0n,
        timestamp: 1000n,
      }),
      createDelegation({
        delegatorAccountId: DELEGATOR_A,
        delegateAccountId: OTHER_DELEGATE,
        previousDelegate: DELEGATE,
        delegatedValue: 700n,
        timestamp: 2000n,
      }),
    ]);

    const result = await repository.getFormerDelegators(
      DELEGATE,
      0,
      10,
      "desc",
    );

    expect(result.items[0]).toMatchObject({
      amount: 0n,
      redelegatedAmount: 700n,
    });
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
        delegatedValue: 700n,
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
        redelegatedAmount: 700n,
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

  // Partial delegation DAOs (SCR) write one row per delegatee out of a single
  // DelegateChanged, all sharing the transaction hash, log index and timestamp.
  describe("partial delegation", () => {
    const splitDelegation = (
      transactionHash: string,
      delegates: { delegate: Address; value: bigint }[],
      timestamp: bigint,
    ): DelegationInsert[] =>
      delegates.map(({ delegate, value }) => ({
        transactionHash,
        daoId: "SCR",
        delegateAccountId: delegate,
        delegatorAccountId: DELEGATOR_A,
        delegatedValue: value,
        previousDelegate: null,
        timestamp,
        logIndex: 0,
      }));

    it("keeps a delegate that shares the latest event with another delegate", async () => {
      await db.insert(delegation).values(
        splitDelegation(
          `0x${"1".padStart(64, "0")}`,
          [
            { delegate: DELEGATE, value: 400n },
            { delegate: OTHER_DELEGATE, value: 600n },
          ],
          1000n,
        ),
      );

      const result = await repository.getFormerDelegators(
        DELEGATE,
        0,
        10,
        "desc",
      );

      expect(result).toEqual({ items: [], totalCount: 0 });
    });

    it("reports the delegate dropped from a later split, not its siblings", async () => {
      await db.insert(delegation).values([
        ...splitDelegation(
          `0x${"1".padStart(64, "0")}`,
          [
            { delegate: DELEGATE, value: 400n },
            { delegate: OTHER_DELEGATE, value: 600n },
          ],
          1000n,
        ),
        ...splitDelegation(
          `0x${"2".padStart(64, "0")}`,
          [
            { delegate: OTHER_DELEGATE, value: 500n },
            { delegate: THIRD_DELEGATE, value: 500n },
          ],
          2000n,
        ),
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
          amount: 400n,
          // no single destination for a split, so the whole event is reported
          redelegatedAmount: 1000n,
          startTimestamp: 1000n,
          endTimestamp: 2000n,
          redelegatedTo: null,
        },
      ]);

      // the sibling that stayed is still an active delegate
      const other = await repository.getFormerDelegators(
        OTHER_DELEGATE,
        0,
        10,
        "desc",
      );
      expect(other).toEqual({ items: [], totalCount: 0 });
    });

    // Rescaling a stale value must carry the fraction this delegate held, not
    // the whole move-away event: the siblings' part was never its voting power.
    it("keeps the delegate's fraction when the balance changed while delegated", async () => {
      await db.insert(delegation).values([
        // 40% of a 1000 balance
        ...splitDelegation(
          `0x${"1".padStart(64, "0")}`,
          [
            { delegate: DELEGATE, value: 400n },
            { delegate: OTHER_DELEGATE, value: 600n },
          ],
          1000n,
        ),
        // balance doubled to 2000 before the split dropped this delegate
        ...splitDelegation(
          `0x${"2".padStart(64, "0")}`,
          [
            { delegate: OTHER_DELEGATE, value: 1000n },
            { delegate: THIRD_DELEGATE, value: 1000n },
          ],
          2000n,
        ),
      ]);

      const result = await repository.getFormerDelegators(
        DELEGATE,
        0,
        10,
        "desc",
      );

      expect(result.items[0]).toMatchObject({
        // 40% of 2000, not the 2000 the whole event moved
        amount: 800n,
        redelegatedAmount: 2000n,
      });
    });
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
