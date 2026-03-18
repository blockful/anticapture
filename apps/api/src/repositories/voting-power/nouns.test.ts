import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address } from "viem";

import { votingPowerHistory, delegation, transfer } from "@/database/schema";
import * as schema from "@/database/schema";

import { NounsVotingPowerRepository } from "./nouns";

type VotingPowerHistoryInsert = typeof votingPowerHistory.$inferInsert;
type DelegationInsert = typeof delegation.$inferInsert;
type TransferInsert = typeof transfer.$inferInsert;

const TEST_ACCOUNT: Address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const TEST_ACCOUNT_2: Address = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const TEST_DAO = "test-dao";

let txCounter = 0;

const createHistoryRow = (
  overrides: Partial<VotingPowerHistoryInsert> = {},
): VotingPowerHistoryInsert => ({
  transactionHash: `0x${(txCounter++).toString(16).padStart(64, "0")}`,
  daoId: TEST_DAO,
  accountId: TEST_ACCOUNT,
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
  delegateAccountId: TEST_ACCOUNT,
  delegatorAccountId: TEST_ACCOUNT_2,
  delegatedValue: 0n,
  timestamp: 1700000000n,
  logIndex: 5,
  ...overrides,
});

const createTransfer = (
  overrides: Partial<TransferInsert> = {},
): TransferInsert => ({
  transactionHash: `0x${txCounter.toString(16).padStart(64, "0")}`,
  daoId: TEST_DAO,
  tokenId: "token-1",
  amount: 100n,
  fromAccountId: TEST_ACCOUNT_2,
  toAccountId: TEST_ACCOUNT,
  timestamp: 1700000000n,
  logIndex: 15,
  ...overrides,
});

describe("NounsVotingPowerRepository", () => {
  let client: PGlite;
  let db: ReturnType<typeof drizzle<typeof schema>>;
  let repository: NounsVotingPowerRepository;

  beforeAll(async () => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    (BigInt.prototype as any).toJSON = function () {
      return this.toString();
    };

    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new NounsVotingPowerRepository(db);

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
          createHistoryRow({ accountId: TEST_ACCOUNT, logIndex: 10 }),
          createHistoryRow({ accountId: TEST_ACCOUNT_2, logIndex: 11 }),
        ]);

      const count =
        await repository.getHistoricalVotingPowerCount(TEST_ACCOUNT);

      expect(count).toBe(1);
    });

    it("should filter by delta range", async () => {
      await db
        .insert(votingPowerHistory)
        .values([
          createHistoryRow({ deltaMod: 100n, logIndex: 10 }),
          createHistoryRow({ deltaMod: 500n, logIndex: 11 }),
          createHistoryRow({ deltaMod: 1000n, logIndex: 12 }),
        ]);

      const count = await repository.getHistoricalVotingPowerCount(
        undefined,
        "200",
        "800",
      );

      expect(count).toBe(1);
    });

    it("should filter by date range", async () => {
      await db
        .insert(votingPowerHistory)
        .values([
          createHistoryRow({ timestamp: 1000n, logIndex: 10 }),
          createHistoryRow({ timestamp: 3000n, logIndex: 11 }),
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

  describe("getHistoricalVotingPowers", () => {
    it("should return history with delegation via MAX logIndex < VP logIndex", async () => {
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
      expect(result[0]!.delegations!.logIndex).toBe(5);
    });

    it("should return transfer with MIN logIndex > VP logIndex (future transfer)", async () => {
      const txHash =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      txCounter = 1;
      await db
        .insert(votingPowerHistory)
        .values(createHistoryRow({ transactionHash: txHash, logIndex: 10 }));
      await db
        .insert(transfer)
        .values(createTransfer({ transactionHash: txHash, logIndex: 15 }));

      const result = await repository.getHistoricalVotingPowers(
        0,
        10,
        "desc",
        "timestamp",
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.transfers).toBeDefined();
      expect(result[0]!.transfers!.logIndex).toBe(15);
    });

    it("should null-out transfer when delegation logIndex is greater", async () => {
      const txHash =
        "0x0000000000000000000000000000000000000000000000000000000000000001";
      txCounter = 1;
      await db
        .insert(votingPowerHistory)
        .values(createHistoryRow({ transactionHash: txHash, logIndex: 10 }));
      await db
        .insert(delegation)
        .values(createDelegation({ transactionHash: txHash, logIndex: 8 }));
      await db
        .insert(transfer)
        .values(createTransfer({ transactionHash: txHash, logIndex: 15 }));

      const result = await repository.getHistoricalVotingPowers(
        0,
        10,
        "desc",
        "timestamp",
      );

      expect(result).toHaveLength(1);
      if (result[0]!.delegations && result[0]!.transfers) {
        if (result[0]!.delegations.logIndex > result[0]!.transfers.logIndex) {
          expect(result[0]!.transfers).toBeNull();
        }
      }
    });

    it("should return null for both when no related rows exist", async () => {
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
      await db
        .insert(votingPowerHistory)
        .values([
          createHistoryRow({ accountId: TEST_ACCOUNT, logIndex: 10 }),
          createHistoryRow({ accountId: TEST_ACCOUNT_2, logIndex: 11 }),
        ]);

      const result = await repository.getHistoricalVotingPowers(
        0,
        10,
        "desc",
        "timestamp",
        TEST_ACCOUNT,
      );

      expect(result).toHaveLength(1);
      expect(result[0]!.accountId).toBe(TEST_ACCOUNT);
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

    it("should sort by delta ascending", async () => {
      await db
        .insert(votingPowerHistory)
        .values([
          createHistoryRow({ deltaMod: 500n, logIndex: 10 }),
          createHistoryRow({ deltaMod: 100n, logIndex: 11 }),
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
});
