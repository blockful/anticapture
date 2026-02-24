import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { pushSchema } from "drizzle-kit/api";
import * as schema from "@/database/schema";
import { accountPower, votingPowerHistory } from "@/database/schema";
import { Address } from "viem";
import { AmountFilter } from "@/mappers";
import { VotingPowerRepository } from ".";

type AccountPowerInsert = typeof accountPower.$inferInsert;
type VotingPowerHistoryInsert = typeof votingPowerHistory.$inferInsert;

const NO_FILTER: AmountFilter = { minAmount: undefined, maxAmount: undefined };

const TEST_ACCOUNT_1 = "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" as Address;
const TEST_ACCOUNT_2 = "0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B" as Address;
const TEST_DAO = "test-dao";

const createAccountPowerRow = (
  overrides: Partial<AccountPowerInsert> = {},
): AccountPowerInsert => ({
  accountId: TEST_ACCOUNT_1,
  daoId: TEST_DAO,
  votingPower: 1000n,
  votesCount: 5,
  proposalsCount: 2,
  delegationsCount: 3,
  lastVoteTimestamp: 0n,
  ...overrides,
});

const createHistoryRow = (
  overrides: Partial<VotingPowerHistoryInsert> = {},
): VotingPowerHistoryInsert => ({
  transactionHash: "0xtx1",
  daoId: TEST_DAO,
  accountId: TEST_ACCOUNT_1,
  votingPower: 1000n,
  delta: 200n,
  deltaMod: 200n,
  timestamp: 1700000000n,
  logIndex: 0,
  ...overrides,
});

describe("VotingPowerRepository - getVotingPowers", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: VotingPowerRepository;

  beforeAll(async () => {
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new VotingPowerRepository(db as any);

    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(votingPowerHistory);
    await db.delete(accountPower);
  });

  it("should return items with variation data from history", async () => {
    await db.insert(accountPower).values(createAccountPowerRow());
    await db.insert(votingPowerHistory).values(createHistoryRow({ delta: 200n }));

    const result = await repository.getVotingPowers(
      0, 10, "desc", "votingPower", NO_FILTER, [],
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.accountId).toBe(TEST_ACCOUNT_1);
    expect(result.items[0]!.absoluteChange).toBe(200n);
    expect(result.totalCount).toBe(1);
  });

  it("should return zero variation when no history exists", async () => {
    await db.insert(accountPower).values(createAccountPowerRow());

    const result = await repository.getVotingPowers(
      0, 10, "desc", "votingPower", NO_FILTER, [],
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.absoluteChange).toBe(0n);
    expect(result.items[0]!.percentageChange).toBe(0);
  });

  it("should aggregate multiple history entries for the same account", async () => {
    await db.insert(accountPower).values(createAccountPowerRow({ votingPower: 1000n }));
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ delta: 300n, logIndex: 0 }),
      createHistoryRow({ delta: 200n, logIndex: 1, transactionHash: "0xtx2" }),
    ]);

    const result = await repository.getVotingPowers(
      0, 10, "desc", "votingPower", NO_FILTER, [],
    );

    expect(result.items[0]!.absoluteChange).toBe(500n);
  });

  it("should filter history by fromDate and toDate", async () => {
    await db.insert(accountPower).values(createAccountPowerRow());
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ delta: 100n, timestamp: 1699000000n, logIndex: 0 }),
      createHistoryRow({ delta: 200n, timestamp: 1700500000n, logIndex: 1, transactionHash: "0xtx2" }),
      createHistoryRow({ delta: 400n, timestamp: 1702000000n, logIndex: 2, transactionHash: "0xtx3" }),
    ]);

    const result = await repository.getVotingPowers(
      0, 10, "desc", "votingPower", NO_FILTER, [],
      1700000000,
      1701000000,
    );

    expect(result.items[0]!.absoluteChange).toBe(200n);
  });

  it("should handle negative deltas correctly", async () => {
    await db.insert(accountPower).values(createAccountPowerRow({ votingPower: 500n }));
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ delta: -300n, deltaMod: 300n, logIndex: 0 }),
    ]);

    const result = await repository.getVotingPowers(
      0, 10, "desc", "votingPower", NO_FILTER, [],
    );

    expect(result.items[0]!.absoluteChange).toBe(-300n);
  });

  it("should paginate results with skip and limit", async () => {
    await db.insert(accountPower).values([
      createAccountPowerRow({ accountId: TEST_ACCOUNT_1, votingPower: 1000n }),
      createAccountPowerRow({ accountId: TEST_ACCOUNT_2, votingPower: 500n }),
    ]);

    const page1 = await repository.getVotingPowers(
      0, 1, "desc", "votingPower", NO_FILTER, [],
    );
    const page2 = await repository.getVotingPowers(
      1, 1, "desc", "votingPower", NO_FILTER, [],
    );

    expect(page1.items).toHaveLength(1);
    expect(page1.items[0]!.votingPower).toBe(1000n);
    expect(page1.totalCount).toBe(2);
    expect(page2.items).toHaveLength(1);
    expect(page2.items[0]!.votingPower).toBe(500n);
  });

  it("should order by variation using absolute value", async () => {
    await db.insert(accountPower).values([
      createAccountPowerRow({ accountId: TEST_ACCOUNT_1, votingPower: 1000n }),
      createAccountPowerRow({ accountId: TEST_ACCOUNT_2, votingPower: 800n }),
    ]);
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ accountId: TEST_ACCOUNT_1, delta: 100n, logIndex: 0 }),
      createHistoryRow({ accountId: TEST_ACCOUNT_2, delta: -500n, deltaMod: 500n, logIndex: 1, transactionHash: "0xtx2" }),
    ]);

    const result = await repository.getVotingPowers(
      0, 10, "desc", "variation", NO_FILTER, [],
    );

    expect(result.items[0]!.accountId).toBe(TEST_ACCOUNT_2);
    expect(result.items[1]!.accountId).toBe(TEST_ACCOUNT_1);
  });

  it("should filter by addresses", async () => {
    await db.insert(accountPower).values([
      createAccountPowerRow({ accountId: TEST_ACCOUNT_1 }),
      createAccountPowerRow({ accountId: TEST_ACCOUNT_2 }),
    ]);

    const result = await repository.getVotingPowers(
      0, 10, "desc", "votingPower", NO_FILTER, [TEST_ACCOUNT_1],
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.accountId).toBe(TEST_ACCOUNT_1);
    expect(result.totalCount).toBe(1);
  });

  it("should calculate percentage change correctly", async () => {
    await db.insert(accountPower).values(
      createAccountPowerRow({ votingPower: 1200n }),
    );
    await db.insert(votingPowerHistory).values(
      createHistoryRow({ delta: 200n }),
    );

    const result = await repository.getVotingPowers(
      0, 10, "desc", "votingPower", NO_FILTER, [],
    );

    expect(result.items[0]!.percentageChange).toBe(20);
  });

  it("should return 0 percentage when previous voting power was 0", async () => {
    await db.insert(accountPower).values(
      createAccountPowerRow({ votingPower: 500n }),
    );
    await db.insert(votingPowerHistory).values(
      createHistoryRow({ delta: 500n }),
    );

    const result = await repository.getVotingPowers(
      0, 10, "desc", "votingPower", NO_FILTER, [],
    );

    expect(result.items[0]!.percentageChange).toBe(0);
  });
});

describe("VotingPowerRepository - getVotingPowersByAccountId", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: VotingPowerRepository;

  beforeAll(async () => {
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new VotingPowerRepository(db as any);

    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(votingPowerHistory);
    await db.delete(accountPower);
  });

  it("should return account data with variation", async () => {
    await db.insert(accountPower).values(createAccountPowerRow({ votingPower: 1200n }));
    await db.insert(votingPowerHistory).values(createHistoryRow({ delta: 200n }));

    const result = await repository.getVotingPowersByAccountId(TEST_ACCOUNT_1);

    expect(result.accountId).toBe(TEST_ACCOUNT_1);
    expect(result.votingPower).toBe(1200n);
    expect(result.absoluteChange).toBe(200n);
    expect(result.percentageChange).toBe(20);
  });

  it("should return zero defaults for non-existent account", async () => {
    const result = await repository.getVotingPowersByAccountId(TEST_ACCOUNT_1);

    expect(result.accountId).toBe(TEST_ACCOUNT_1);
    expect(result.votingPower).toBe(0n);
    expect(result.absoluteChange).toBe(0n);
    expect(result.percentageChange).toBe(0);
  });

  it("should aggregate all history deltas for the account", async () => {
    await db.insert(accountPower).values(createAccountPowerRow({ votingPower: 1000n }));
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ delta: 300n, logIndex: 0 }),
      createHistoryRow({ delta: -100n, deltaMod: 100n, logIndex: 1, transactionHash: "0xtx2" }),
    ]);

    const result = await repository.getVotingPowersByAccountId(TEST_ACCOUNT_1);

    expect(result.absoluteChange).toBe(200n);
  });

  it("should filter history by fromDate and toDate for the account", async () => {
    await db.insert(accountPower).values(createAccountPowerRow({ votingPower: 1000n }));
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ delta: 100n, timestamp: 1699000000n, logIndex: 0 }),
      createHistoryRow({ delta: 200n, timestamp: 1700500000n, logIndex: 1, transactionHash: "0xtx2" }),
      createHistoryRow({ delta: 400n, timestamp: 1702000000n, logIndex: 2, transactionHash: "0xtx3" }),
    ]);

    const result = await repository.getVotingPowersByAccountId(
      TEST_ACCOUNT_1,
      1700000000,
      1701000000,
    );

    expect(result.absoluteChange).toBe(200n);
    expect(result.percentageChange).toBe(25);
  });

  it("should not include history from other accounts", async () => {
    await db.insert(accountPower).values([
      createAccountPowerRow({ accountId: TEST_ACCOUNT_1, votingPower: 1000n }),
      createAccountPowerRow({ accountId: TEST_ACCOUNT_2, votingPower: 500n }),
    ]);
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ accountId: TEST_ACCOUNT_1, delta: 100n, logIndex: 0 }),
      createHistoryRow({ accountId: TEST_ACCOUNT_2, delta: 400n, logIndex: 1, transactionHash: "0xtx2" }),
    ]);

    const result = await repository.getVotingPowersByAccountId(TEST_ACCOUNT_1);

    expect(result.absoluteChange).toBe(100n);
  });
});
