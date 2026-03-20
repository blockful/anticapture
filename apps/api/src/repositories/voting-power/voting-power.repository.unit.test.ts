import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address } from "viem";

import type { Drizzle } from "@/database";
import * as schema from "@/database/schema";
import {
  accountPower,
  votingPowerHistory,
  delegation,
  transfer,
} from "@/database/schema";
import { AmountFilter } from "@/mappers";
import { PERCENTAGE_NO_BASELINE } from "@/mappers/constants";

import { VotingPowerRepository } from ".";

type AccountPowerInsert = typeof accountPower.$inferInsert;
type VotingPowerHistoryInsert = typeof votingPowerHistory.$inferInsert;
type DelegationInsert = typeof delegation.$inferInsert;
type TransferInsert = typeof transfer.$inferInsert;

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

let vpTxCounter = 0;

const createDelegationRow = (
  overrides: Partial<DelegationInsert> = {},
): DelegationInsert => ({
  transactionHash: `0x${(vpTxCounter++).toString(16).padStart(64, "0")}`,
  daoId: TEST_DAO,
  delegateAccountId: TEST_ACCOUNT_1,
  delegatorAccountId: TEST_ACCOUNT_2,
  delegatedValue: 0n,
  timestamp: 1700000000n,
  logIndex: 5,
  ...overrides,
});

const createTransferRow = (
  overrides: Partial<TransferInsert> = {},
): TransferInsert => ({
  transactionHash: `0x${vpTxCounter.toString(16).padStart(64, "0")}`,
  daoId: TEST_DAO,
  tokenId: "token-1",
  amount: 100n,
  fromAccountId: TEST_ACCOUNT_2,
  toAccountId: TEST_ACCOUNT_1,
  timestamp: 1700000000n,
  logIndex: 5,
  ...overrides,
});

describe("VotingPowerRepository - getVotingPowers", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: VotingPowerRepository;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    repository = new VotingPowerRepository(db as any);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
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
    await db
      .insert(votingPowerHistory)
      .values(createHistoryRow({ delta: 200n }));

    const result = await repository.getVotingPowers(
      0,
      10,
      "desc",
      "votingPower",
      NO_FILTER,
      [],
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.accountId).toBe(TEST_ACCOUNT_1);
    expect(result.items[0]!.absoluteChange).toBe(200n);
    expect(result.totalCount).toBe(1);
  });

  it("should return zero variation when no history exists", async () => {
    await db.insert(accountPower).values(createAccountPowerRow());

    const result = await repository.getVotingPowers(
      0,
      10,
      "desc",
      "votingPower",
      NO_FILTER,
      [],
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.absoluteChange).toBe(0n);
    expect(result.items[0]!.percentageChange).toBe("0.00");
  });

  it("should aggregate multiple history entries for the same account", async () => {
    await db
      .insert(accountPower)
      .values(createAccountPowerRow({ votingPower: 1000n }));
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ delta: 300n, logIndex: 0 }),
      createHistoryRow({
        delta: 200n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
    ]);

    const result = await repository.getVotingPowers(
      0,
      10,
      "desc",
      "votingPower",
      NO_FILTER,
      [],
    );

    expect(result.items[0]!.absoluteChange).toBe(500n);
  });

  it("should filter history by fromDate and toDate", async () => {
    await db.insert(accountPower).values(createAccountPowerRow());
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ delta: 100n, timestamp: 1699000000n, logIndex: 0 }),
      createHistoryRow({
        delta: 200n,
        timestamp: 1700500000n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
      createHistoryRow({
        delta: 400n,
        timestamp: 1702000000n,
        logIndex: 2,
        transactionHash: "0xtx3",
      }),
    ]);

    const result = await repository.getVotingPowers(
      0,
      10,
      "desc",
      "votingPower",
      NO_FILTER,
      [],
      1700000000,
      1701000000,
    );

    expect(result.items[0]!.absoluteChange).toBe(200n);
  });

  it("should handle negative deltas correctly", async () => {
    await db
      .insert(accountPower)
      .values(createAccountPowerRow({ votingPower: 500n }));
    await db
      .insert(votingPowerHistory)
      .values([
        createHistoryRow({ delta: -300n, deltaMod: 300n, logIndex: 0 }),
      ]);

    const result = await repository.getVotingPowers(
      0,
      10,
      "desc",
      "votingPower",
      NO_FILTER,
      [],
    );

    expect(result.items[0]!.absoluteChange).toBe(-300n);
  });

  it("should paginate results with skip and limit", async () => {
    await db.insert(accountPower).values([
      createAccountPowerRow({
        accountId: TEST_ACCOUNT_1,
        votingPower: 1000n,
      }),
      createAccountPowerRow({ accountId: TEST_ACCOUNT_2, votingPower: 500n }),
    ]);

    const page1 = await repository.getVotingPowers(
      0,
      1,
      "desc",
      "votingPower",
      NO_FILTER,
      [],
    );
    const page2 = await repository.getVotingPowers(
      1,
      1,
      "desc",
      "votingPower",
      NO_FILTER,
      [],
    );

    expect(page1.items).toHaveLength(1);
    expect(page1.items[0]!.votingPower).toBe(1000n);
    expect(page1.totalCount).toBe(2);
    expect(page2.items).toHaveLength(1);
    expect(page2.items[0]!.votingPower).toBe(500n);
  });

  it("should order by variation using absolute value", async () => {
    await db.insert(accountPower).values([
      createAccountPowerRow({
        accountId: TEST_ACCOUNT_1,
        votingPower: 1000n,
      }),
      createAccountPowerRow({ accountId: TEST_ACCOUNT_2, votingPower: 800n }),
    ]);
    await db.insert(votingPowerHistory).values([
      createHistoryRow({
        accountId: TEST_ACCOUNT_1,
        delta: 100n,
        logIndex: 0,
      }),
      createHistoryRow({
        accountId: TEST_ACCOUNT_2,
        delta: -500n,
        deltaMod: 500n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
    ]);

    const result = await repository.getVotingPowers(
      0,
      10,
      "desc",
      "variation",
      NO_FILTER,
      [],
    );

    expect(result.items[0]!.accountId).toBe(TEST_ACCOUNT_2);
    expect(result.items[1]!.accountId).toBe(TEST_ACCOUNT_1);
  });

  it("should order by signedVariation from positive to negative on desc", async () => {
    await db.insert(accountPower).values([
      createAccountPowerRow({
        accountId: TEST_ACCOUNT_1,
        votingPower: 1000n,
      }),
      createAccountPowerRow({ accountId: TEST_ACCOUNT_2, votingPower: 800n }),
    ]);
    await db.insert(votingPowerHistory).values([
      createHistoryRow({
        accountId: TEST_ACCOUNT_1,
        delta: 100n,
        logIndex: 0,
      }),
      createHistoryRow({
        accountId: TEST_ACCOUNT_2,
        delta: -500n,
        deltaMod: 500n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
    ]);

    const result = await repository.getVotingPowers(
      0,
      10,
      "desc",
      "signedVariation",
      NO_FILTER,
      [],
    );

    expect(result.items[0]!.accountId).toBe(TEST_ACCOUNT_1);
    expect(result.items[1]!.accountId).toBe(TEST_ACCOUNT_2);
  });

  it("should order by signedVariation from negative to positive on asc", async () => {
    await db.insert(accountPower).values([
      createAccountPowerRow({
        accountId: TEST_ACCOUNT_1,
        votingPower: 1000n,
      }),
      createAccountPowerRow({ accountId: TEST_ACCOUNT_2, votingPower: 800n }),
    ]);
    await db.insert(votingPowerHistory).values([
      createHistoryRow({
        accountId: TEST_ACCOUNT_1,
        delta: 100n,
        logIndex: 0,
      }),
      createHistoryRow({
        accountId: TEST_ACCOUNT_2,
        delta: -500n,
        deltaMod: 500n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
    ]);

    const result = await repository.getVotingPowers(
      0,
      10,
      "asc",
      "signedVariation",
      NO_FILTER,
      [],
    );

    expect(result.items[0]!.accountId).toBe(TEST_ACCOUNT_2);
    expect(result.items[1]!.accountId).toBe(TEST_ACCOUNT_1);
  });

  it("should filter by addresses", async () => {
    await db
      .insert(accountPower)
      .values([
        createAccountPowerRow({ accountId: TEST_ACCOUNT_1 }),
        createAccountPowerRow({ accountId: TEST_ACCOUNT_2 }),
      ]);

    const result = await repository.getVotingPowers(
      0,
      10,
      "desc",
      "votingPower",
      NO_FILTER,
      [TEST_ACCOUNT_1],
    );

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.accountId).toBe(TEST_ACCOUNT_1);
    expect(result.totalCount).toBe(1);
  });

  it("should calculate percentage change correctly", async () => {
    await db
      .insert(accountPower)
      .values(createAccountPowerRow({ votingPower: 1200n }));
    await db
      .insert(votingPowerHistory)
      .values(createHistoryRow({ delta: 200n }));

    const result = await repository.getVotingPowers(
      0,
      10,
      "desc",
      "votingPower",
      NO_FILTER,
      [],
    );

    expect(result.items[0]!.percentageChange).toBe("20.00");
  });

  it("should return NO BASELINE when previous voting power was 0 and there is a change", async () => {
    await db
      .insert(accountPower)
      .values(createAccountPowerRow({ votingPower: 500n }));
    await db
      .insert(votingPowerHistory)
      .values(createHistoryRow({ delta: 500n }));

    const result = await repository.getVotingPowers(
      0,
      10,
      "desc",
      "votingPower",
      NO_FILTER,
      [],
    );

    expect(result.items[0]!.percentageChange).toBe(PERCENTAGE_NO_BASELINE);
  });

  it("should return 0 when previous voting power was 0 and there is no change", async () => {
    await db
      .insert(accountPower)
      .values(createAccountPowerRow({ votingPower: 0n }));

    const result = await repository.getVotingPowers(
      0,
      10,
      "desc",
      "votingPower",
      NO_FILTER,
      [],
    );

    expect(result.items[0]!.percentageChange).toBe("0");
  });
});

describe("VotingPowerRepository - getVotingPowersByAccountId", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: VotingPowerRepository;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    repository = new VotingPowerRepository(db as any);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
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
    await db
      .insert(accountPower)
      .values(createAccountPowerRow({ votingPower: 1200n }));
    await db
      .insert(votingPowerHistory)
      .values(createHistoryRow({ delta: 200n }));

    const result = await repository.getVotingPowersByAccountId(TEST_ACCOUNT_1);

    expect(result.accountId).toBe(TEST_ACCOUNT_1);
    expect(result.votingPower).toBe(1200n);
    expect(result.absoluteChange).toBe(200n);
    expect(result.percentageChange).toBe("20.00");
  });

  it("should return zero defaults for non-existent account", async () => {
    const result = await repository.getVotingPowersByAccountId(TEST_ACCOUNT_1);

    expect(result.accountId).toBe(TEST_ACCOUNT_1);
    expect(result.votingPower).toBe(0n);
    expect(result.absoluteChange).toBe(0n);
    expect(result.percentageChange).toBe("0");
  });

  it("should aggregate all history deltas for the account", async () => {
    await db
      .insert(accountPower)
      .values(createAccountPowerRow({ votingPower: 1000n }));
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ delta: 300n, logIndex: 0 }),
      createHistoryRow({
        delta: -100n,
        deltaMod: 100n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
    ]);

    const result = await repository.getVotingPowersByAccountId(TEST_ACCOUNT_1);

    expect(result.absoluteChange).toBe(200n);
  });

  it("should filter history by fromDate and toDate for the account", async () => {
    await db
      .insert(accountPower)
      .values(createAccountPowerRow({ votingPower: 1000n }));
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ delta: 100n, timestamp: 1699000000n, logIndex: 0 }),
      createHistoryRow({
        delta: 200n,
        timestamp: 1700500000n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
      createHistoryRow({
        delta: 400n,
        timestamp: 1702000000n,
        logIndex: 2,
        transactionHash: "0xtx3",
      }),
    ]);

    const result = await repository.getVotingPowersByAccountId(
      TEST_ACCOUNT_1,
      1700000000,
      1701000000,
    );

    expect(result.absoluteChange).toBe(200n);
    expect(result.percentageChange).toBe("25.00");
  });

  it("should not include history from other accounts", async () => {
    await db.insert(accountPower).values([
      createAccountPowerRow({
        accountId: TEST_ACCOUNT_1,
        votingPower: 1000n,
      }),
      createAccountPowerRow({ accountId: TEST_ACCOUNT_2, votingPower: 500n }),
    ]);
    await db.insert(votingPowerHistory).values([
      createHistoryRow({
        accountId: TEST_ACCOUNT_1,
        delta: 100n,
        logIndex: 0,
      }),
      createHistoryRow({
        accountId: TEST_ACCOUNT_2,
        delta: 400n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
    ]);

    const result = await repository.getVotingPowersByAccountId(TEST_ACCOUNT_1);

    expect(result.absoluteChange).toBe(100n);
  });
});

describe("VotingPowerRepository - getHistoricalVotingPowerCount", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: VotingPowerRepository;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new VotingPowerRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(votingPowerHistory);
    await db.delete(accountPower);
    await db.delete(delegation);
    await db.delete(transfer);
    vpTxCounter = 0;
  });

  it("should return count of all history entries", async () => {
    await db
      .insert(votingPowerHistory)
      .values([
        createHistoryRow({ logIndex: 0 }),
        createHistoryRow({ logIndex: 1, transactionHash: "0xtx2" }),
      ]);

    const count = await repository.getHistoricalVotingPowerCount();

    expect(count).toBe(2);
  });

  it("should filter by accountId", async () => {
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ accountId: TEST_ACCOUNT_1, logIndex: 0 }),
      createHistoryRow({
        accountId: TEST_ACCOUNT_2,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
    ]);

    const count =
      await repository.getHistoricalVotingPowerCount(TEST_ACCOUNT_1);

    expect(count).toBe(1);
  });

  it("should filter by delta range", async () => {
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ deltaMod: 100n, logIndex: 0 }),
      createHistoryRow({
        deltaMod: 500n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
      createHistoryRow({
        deltaMod: 1000n,
        logIndex: 2,
        transactionHash: "0xtx3",
      }),
    ]);

    const count = await repository.getHistoricalVotingPowerCount(
      undefined,
      "200",
      "800",
    );

    expect(count).toBe(1);
  });

  it("should filter by date range", async () => {
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ timestamp: 1000n, logIndex: 0 }),
      createHistoryRow({
        timestamp: 3000n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
    ]);

    const count = await repository.getHistoricalVotingPowerCount(
      undefined,
      undefined,
      undefined,
      2000,
      4000,
    );

    expect(count).toBe(1);
  });

  it("should return 0 when no data exists", async () => {
    const count = await repository.getHistoricalVotingPowerCount();

    expect(count).toBe(0);
  });
});

describe("VotingPowerRepository - getHistoricalVotingPowers", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: VotingPowerRepository;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new VotingPowerRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(votingPowerHistory);
    await db.delete(accountPower);
    await db.delete(delegation);
    await db.delete(transfer);
    vpTxCounter = 0;
  });

  it("should return history with LEFT JOIN delegation", async () => {
    const txHash = "0xtx-hist-1";
    await db
      .insert(votingPowerHistory)
      .values(createHistoryRow({ transactionHash: txHash, logIndex: 10 }));
    await db
      .insert(delegation)
      .values(createDelegationRow({ transactionHash: txHash, logIndex: 5 }));

    const result = await repository.getHistoricalVotingPowers(
      0,
      10,
      "desc",
      "timestamp",
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.delegations).toBeDefined();
    expect(result[0]!.delegations!.logIndex).toBe(5);
  });

  it("should return history with LEFT JOIN transfer", async () => {
    const txHash = "0xtx-hist-2";
    await db
      .insert(votingPowerHistory)
      .values(createHistoryRow({ transactionHash: txHash, logIndex: 10 }));
    await db
      .insert(transfer)
      .values(createTransferRow({ transactionHash: txHash, logIndex: 5 }));

    const result = await repository.getHistoricalVotingPowers(
      0,
      10,
      "desc",
      "timestamp",
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.transfers).toBeDefined();
    expect(result[0]!.transfers!.logIndex).toBe(5);
  });

  it("should return null when no related delegation or transfer exist", async () => {
    await db
      .insert(votingPowerHistory)
      .values(createHistoryRow({ logIndex: 10 }));

    const result = await repository.getHistoricalVotingPowers(
      0,
      10,
      "desc",
      "timestamp",
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.delegations).toBeNull();
    expect(result[0]!.transfers).toBeNull();
  });

  it("should filter by accountId", async () => {
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ accountId: TEST_ACCOUNT_1, logIndex: 0 }),
      createHistoryRow({
        accountId: TEST_ACCOUNT_2,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
    ]);

    const result = await repository.getHistoricalVotingPowers(
      0,
      10,
      "desc",
      "timestamp",
      TEST_ACCOUNT_1,
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.accountId).toBe(TEST_ACCOUNT_1);
  });

  it("should sort by timestamp descending", async () => {
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ timestamp: 1000n, logIndex: 0 }),
      createHistoryRow({
        timestamp: 2000n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
    ]);

    const result = await repository.getHistoricalVotingPowers(
      0,
      10,
      "desc",
      "timestamp",
    );

    expect(result[0]!.timestamp).toBe(2000n);
    expect(result[1]!.timestamp).toBe(1000n);
  });

  it("should sort by delta ascending", async () => {
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ deltaMod: 500n, logIndex: 0 }),
      createHistoryRow({
        deltaMod: 100n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
    ]);

    const result = await repository.getHistoricalVotingPowers(
      0,
      10,
      "asc",
      "delta",
    );

    expect(result[0]!.deltaMod).toBe(100n);
    expect(result[1]!.deltaMod).toBe(500n);
  });

  it("should apply pagination", async () => {
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ timestamp: 3000n, logIndex: 0 }),
      createHistoryRow({
        timestamp: 2000n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
      createHistoryRow({
        timestamp: 1000n,
        logIndex: 2,
        transactionHash: "0xtx3",
      }),
    ]);

    const result = await repository.getHistoricalVotingPowers(
      1,
      1,
      "desc",
      "timestamp",
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.timestamp).toBe(2000n);
  });

  it("should return empty when no data exists", async () => {
    const result = await repository.getHistoricalVotingPowers(
      0,
      10,
      "desc",
      "timestamp",
    );

    expect(result).toEqual([]);
  });
});

describe("VotingPowerRepository - getVotingPowerVariations", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: VotingPowerRepository;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new VotingPowerRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(votingPowerHistory);
    await db.delete(accountPower);
    vpTxCounter = 0;
  });

  it("should compute variation between two time snapshots", async () => {
    await db.insert(votingPowerHistory).values([
      createHistoryRow({
        accountId: TEST_ACCOUNT_1,
        votingPower: 500n,
        timestamp: 1000n,
        logIndex: 0,
      }),
      createHistoryRow({
        accountId: TEST_ACCOUNT_1,
        votingPower: 1000n,
        timestamp: 3000n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
    ]);

    const result = await repository.getVotingPowerVariations(
      1500,
      3500,
      0,
      10,
      "desc",
    );

    expect(result).toHaveLength(1);
    expect(BigInt(result[0]!.absoluteChange)).toBe(500n);
  });

  it("should handle NO_BASELINE when from snapshot is missing", async () => {
    await db.insert(votingPowerHistory).values(
      createHistoryRow({
        accountId: TEST_ACCOUNT_1,
        votingPower: 1000n,
        timestamp: 3000n,
        logIndex: 0,
      }),
    );

    const result = await repository.getVotingPowerVariations(
      500,
      3500,
      0,
      10,
      "desc",
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.percentageChange).toBe(PERCENTAGE_NO_BASELINE);
  });

  it("should order by absolute change descending", async () => {
    await db.insert(votingPowerHistory).values([
      createHistoryRow({
        accountId: TEST_ACCOUNT_1,
        votingPower: 500n,
        timestamp: 1000n,
        logIndex: 0,
      }),
      createHistoryRow({
        accountId: TEST_ACCOUNT_1,
        votingPower: 600n,
        timestamp: 3000n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
      createHistoryRow({
        accountId: TEST_ACCOUNT_2,
        votingPower: 100n,
        timestamp: 1000n,
        logIndex: 2,
        transactionHash: "0xtx3",
      }),
      createHistoryRow({
        accountId: TEST_ACCOUNT_2,
        votingPower: 900n,
        timestamp: 3000n,
        logIndex: 3,
        transactionHash: "0xtx4",
      }),
    ]);

    const result = await repository.getVotingPowerVariations(
      1500,
      3500,
      0,
      10,
      "desc",
    );

    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(Math.abs(Number(result[0]!.absoluteChange))).toBeGreaterThanOrEqual(
      Math.abs(Number(result[1]!.absoluteChange)),
    );
  });

  it("should filter by addresses", async () => {
    await db.insert(votingPowerHistory).values([
      createHistoryRow({
        accountId: TEST_ACCOUNT_1,
        votingPower: 500n,
        timestamp: 1000n,
        logIndex: 0,
      }),
      createHistoryRow({
        accountId: TEST_ACCOUNT_2,
        votingPower: 300n,
        timestamp: 1000n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
    ]);

    const result = await repository.getVotingPowerVariations(
      undefined,
      1500,
      0,
      10,
      "desc",
      [TEST_ACCOUNT_1],
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.accountId).toBe(TEST_ACCOUNT_1);
  });

  it("should apply pagination", async () => {
    await db.insert(votingPowerHistory).values([
      createHistoryRow({
        accountId: TEST_ACCOUNT_1,
        votingPower: 500n,
        timestamp: 1000n,
        logIndex: 0,
      }),
      createHistoryRow({
        accountId: TEST_ACCOUNT_2,
        votingPower: 300n,
        timestamp: 1000n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
    ]);

    const result = await repository.getVotingPowerVariations(
      undefined,
      1500,
      0,
      1,
      "desc",
    );

    expect(result).toHaveLength(1);
  });
});

describe("VotingPowerRepository - getVotingPowerVariationsByAccountId", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: VotingPowerRepository;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new VotingPowerRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(votingPowerHistory);
    await db.delete(accountPower);
    vpTxCounter = 0;
  });

  it("should return variation for a specific account", async () => {
    await db.insert(accountPower).values(
      createAccountPowerRow({
        accountId: TEST_ACCOUNT_1,
        votingPower: 1200n,
      }),
    );
    await db.insert(votingPowerHistory).values(
      createHistoryRow({
        accountId: TEST_ACCOUNT_1,
        delta: 200n,
        logIndex: 0,
      }),
    );

    const result = await repository.getVotingPowerVariationsByAccountId(
      TEST_ACCOUNT_1,
      undefined,
      undefined,
    );

    expect(result.accountId).toBe(TEST_ACCOUNT_1);
    expect(result.absoluteChange).toBe(200n);
    expect(result.currentVotingPower).toBe(1200n);
    expect(result.previousVotingPower).toBe(1000n);
  });

  it("should filter by date range", async () => {
    await db.insert(accountPower).values(
      createAccountPowerRow({
        accountId: TEST_ACCOUNT_1,
        votingPower: 1000n,
      }),
    );
    await db.insert(votingPowerHistory).values([
      createHistoryRow({
        accountId: TEST_ACCOUNT_1,
        delta: 100n,
        timestamp: 1000n,
        logIndex: 0,
      }),
      createHistoryRow({
        accountId: TEST_ACCOUNT_1,
        delta: 200n,
        timestamp: 3000n,
        logIndex: 1,
        transactionHash: "0xtx2",
      }),
    ]);

    const result = await repository.getVotingPowerVariationsByAccountId(
      TEST_ACCOUNT_1,
      2000,
      4000,
    );

    expect(result.absoluteChange).toBe(200n);
  });

  it("should return zero change when no history exists", async () => {
    await db.insert(accountPower).values(
      createAccountPowerRow({
        accountId: TEST_ACCOUNT_1,
        votingPower: 1000n,
      }),
    );

    const result = await repository.getVotingPowerVariationsByAccountId(
      TEST_ACCOUNT_1,
      undefined,
      undefined,
    );

    expect(result.absoluteChange).toBe(0n);
    expect(result.percentageChange).toBe("0.00");
  });

  it("should throw when account does not exist in accountPower", async () => {
    await expect(
      repository.getVotingPowerVariationsByAccountId(
        TEST_ACCOUNT_1,
        undefined,
        undefined,
      ),
    ).rejects.toThrow("Account not found");
  });
});
