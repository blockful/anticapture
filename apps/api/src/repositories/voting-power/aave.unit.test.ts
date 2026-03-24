import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address } from "viem";

import type { Drizzle } from "@/database";
import {
  votingPowerHistory,
  delegation,
  transfer,
  accountPower,
  accountBalance,
} from "@/database/schema";
import * as schema from "@/database/schema";
import { AmountFilter } from "@/mappers";
import { PERCENTAGE_NO_BASELINE } from "@/mappers/constants";

import { AAVEVotingPowerRepository } from "./aave";

type VotingPowerHistoryInsert = typeof votingPowerHistory.$inferInsert;
type DelegationInsert = typeof delegation.$inferInsert;
type AccountPowerInsert = typeof accountPower.$inferInsert;
type AccountBalanceInsert = typeof accountBalance.$inferInsert;

const TEST_ACCOUNT_1: Address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const TEST_ACCOUNT_2: Address = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const TEST_DAO = "test-dao";

const NO_FILTER: AmountFilter = { minAmount: undefined, maxAmount: undefined };

let txCounter = 0;

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
  transactionHash: `0x${(txCounter++).toString(16).padStart(64, "0")}`,
  daoId: TEST_DAO,
  accountId: TEST_ACCOUNT_1,
  votingPower: 1000n,
  delta: 200n,
  deltaMod: 200n,
  timestamp: 1700000000n,
  logIndex: 10,
  ...overrides,
});

const createDelegation = (
  overrides: Partial<DelegationInsert> = {},
): DelegationInsert => ({
  transactionHash: `0x${txCounter.toString(16).padStart(64, "0")}`,
  daoId: TEST_DAO,
  delegateAccountId: TEST_ACCOUNT_1,
  delegatorAccountId: TEST_ACCOUNT_2,
  delegatedValue: 0n,
  timestamp: 1700000000n,
  logIndex: 5,
  ...overrides,
});

const createAccountBalance = (
  overrides: Partial<AccountBalanceInsert> = {},
): AccountBalanceInsert => ({
  accountId: TEST_ACCOUNT_1,
  tokenId: `token-${txCounter++}`,
  balance: 500n,
  ...overrides,
});

describe("AAVEVotingPowerRepository", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: AAVEVotingPowerRepository;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new AAVEVotingPowerRepository(db);

    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    const { apply } = await pushSchema(schema, db as any);
    await apply();
  });

  afterAll(async () => {
    await client.close();
  });

  beforeEach(async () => {
    await db.delete(votingPowerHistory);
    await db.delete(delegation);
    await db.delete(transfer);
    await db.delete(accountPower);
    await db.delete(accountBalance);
    txCounter = 0;
  });

  describe("getHistoricalVotingPowerCount", () => {
    it("should return count of history entries", async () => {
      await db
        .insert(votingPowerHistory)
        .values([
          createHistoryRow({ logIndex: 10 }),
          createHistoryRow({ logIndex: 11 }),
        ]);

      const count = await repository.getHistoricalVotingPowerCount();

      expect(count).toBe(2);
    });

    it("should filter by accountId", async () => {
      await db
        .insert(votingPowerHistory)
        .values([
          createHistoryRow({ accountId: TEST_ACCOUNT_1, logIndex: 10 }),
          createHistoryRow({ accountId: TEST_ACCOUNT_2, logIndex: 11 }),
        ]);

      const count =
        await repository.getHistoricalVotingPowerCount(TEST_ACCOUNT_1);

      expect(count).toBe(1);
    });

    it("should return 0 when no data exists", async () => {
      const count = await repository.getHistoricalVotingPowerCount();

      expect(count).toBe(0);
    });
  });

  describe("getHistoricalVotingPowers", () => {
    it("should return history with delegation via LEFT JOIN", async () => {
      const txHash =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      txCounter = 1;
      await db
        .insert(votingPowerHistory)
        .values(createHistoryRow({ transactionHash: txHash, logIndex: 10 }));
      await db
        .insert(delegation)
        .values(createDelegation({ transactionHash: txHash, logIndex: 5 }));

      const result = await repository.getHistoricalVotingPowers(
        0,
        10,
        "desc",
        "timestamp",
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.delegations).toBeDefined();
    });

    it("should return null when no related rows exist", async () => {
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

    it("should sort by timestamp descending", async () => {
      await db
        .insert(votingPowerHistory)
        .values([
          createHistoryRow({ timestamp: 1000n, logIndex: 10 }),
          createHistoryRow({ timestamp: 2000n, logIndex: 11 }),
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

    it("should apply pagination", async () => {
      await db
        .insert(votingPowerHistory)
        .values([
          createHistoryRow({ timestamp: 3000n, logIndex: 10 }),
          createHistoryRow({ timestamp: 2000n, logIndex: 11 }),
          createHistoryRow({ timestamp: 1000n, logIndex: 12 }),
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

  describe("getVotingPowers", () => {
    it("should return combined power (VP + balance)", async () => {
      await db.insert(accountPower).values(
        createAccountPowerRow({
          accountId: TEST_ACCOUNT_1,
          votingPower: 1000n,
        }),
      );
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: TEST_ACCOUNT_1,
          tokenId: "aToken",
          balance: 500n,
        }),
      );

      const result = await repository.getVotingPowers(
        0,
        10,
        "desc",
        "votingPower",
        NO_FILTER,
        [],
      );

      expect(result.items).toHaveLength(1);
      expect(BigInt(result.items[0]!.votingPower)).toBe(1500n);
    });

    it("should include accounts only in accountBalance (no accountPower)", async () => {
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: TEST_ACCOUNT_2,
          tokenId: "aToken",
          balance: 300n,
        }),
      );

      const result = await repository.getVotingPowers(
        0,
        10,
        "desc",
        "votingPower",
        NO_FILTER,
        [],
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.accountId).toBe(TEST_ACCOUNT_2);
      expect(BigInt(result.items[0]!.votingPower)).toBe(300n);
    });

    it("should include accounts only in accountPower (no accountBalance)", async () => {
      await db.insert(accountPower).values(
        createAccountPowerRow({
          accountId: TEST_ACCOUNT_1,
          votingPower: 1000n,
        }),
      );

      const result = await repository.getVotingPowers(
        0,
        10,
        "desc",
        "votingPower",
        NO_FILTER,
        [],
      );

      expect(result.items).toHaveLength(1);
      expect(BigInt(result.items[0]!.votingPower)).toBe(1000n);
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
    });

    it("should apply pagination", async () => {
      await db.insert(accountPower).values([
        createAccountPowerRow({
          accountId: TEST_ACCOUNT_1,
          votingPower: 1000n,
        }),
        createAccountPowerRow({
          accountId: TEST_ACCOUNT_2,
          votingPower: 500n,
        }),
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
      expect(page2.items).toHaveLength(1);
      expect(page1.totalCount).toBe(2);
    });

    it("should include variation from history", async () => {
      await db.insert(accountPower).values(
        createAccountPowerRow({
          accountId: TEST_ACCOUNT_1,
          votingPower: 1000n,
        }),
      );
      await db
        .insert(votingPowerHistory)
        .values(createHistoryRow({ accountId: TEST_ACCOUNT_1, delta: 200n }));

      const result = await repository.getVotingPowers(
        0,
        10,
        "desc",
        "votingPower",
        NO_FILTER,
        [],
      );

      expect(result.items[0]!.absoluteChange).toBeDefined();
    });

    it("should return NO BASELINE when previous power was 0 and there is a change", async () => {
      await db.insert(accountPower).values(
        createAccountPowerRow({
          accountId: TEST_ACCOUNT_1,
          votingPower: 500n,
        }),
      );
      await db
        .insert(votingPowerHistory)
        .values(createHistoryRow({ accountId: TEST_ACCOUNT_1, delta: 500n }));

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
  });

  describe("getVotingPowersByAccountId", () => {
    it("should return combined VP + balance for an account", async () => {
      await db.insert(accountPower).values(
        createAccountPowerRow({
          accountId: TEST_ACCOUNT_1,
          votingPower: 1000n,
        }),
      );
      await db.insert(accountBalance).values(
        createAccountBalance({
          accountId: TEST_ACCOUNT_1,
          tokenId: "aToken",
          balance: 500n,
        }),
      );

      const result =
        await repository.getVotingPowersByAccountId(TEST_ACCOUNT_1);

      expect(BigInt(result.votingPower)).toBe(1500n);
    });

    it("should return zero defaults for non-existent account", async () => {
      const result =
        await repository.getVotingPowersByAccountId(TEST_ACCOUNT_1);

      expect(result.accountId).toBe(TEST_ACCOUNT_1);
      expect(result.votingPower).toBe(0n);
      expect(result.absoluteChange).toBe(0n);
      expect(result.percentageChange).toBe("0");
    });

    it("should include variation from history", async () => {
      await db.insert(accountPower).values(
        createAccountPowerRow({
          accountId: TEST_ACCOUNT_1,
          votingPower: 1200n,
        }),
      );
      await db
        .insert(votingPowerHistory)
        .values(createHistoryRow({ accountId: TEST_ACCOUNT_1, delta: 200n }));

      const result =
        await repository.getVotingPowersByAccountId(TEST_ACCOUNT_1);

      expect(BigInt(result.absoluteChange)).toBe(200n);
    });

    it("should filter history by date range", async () => {
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
          logIndex: 10,
        }),
        createHistoryRow({
          accountId: TEST_ACCOUNT_1,
          delta: 200n,
          timestamp: 3000n,
          logIndex: 11,
        }),
      ]);

      const result = await repository.getVotingPowersByAccountId(
        TEST_ACCOUNT_1,
        2000,
        4000,
      );

      expect(BigInt(result.absoluteChange)).toBe(200n);
    });
  });
});
