import { PGlite } from "@electric-sql/pglite";
import { pushSchema } from "drizzle-kit/api";
import { drizzle } from "drizzle-orm/pglite";
import { Address } from "viem";

import type { Drizzle } from "@/database";
import { votingPowerHistory, delegation, transfer } from "@/database/schema";
import * as schema from "@/database/schema";

import { TORNVotingPowerRepository } from "./torn";

type VotingPowerHistoryInsert = typeof votingPowerHistory.$inferInsert;
type DelegationInsert = typeof delegation.$inferInsert;
type TransferInsert = typeof transfer.$inferInsert;

const TEST_ACCOUNT: Address = "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
const TEST_ACCOUNT_2: Address = "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb";
const TEST_DAO = "TORN";
const TX_HASH =
  "0x0000000000000000000000000000000000000000000000000000000000000001";

const createHistoryRow = (
  overrides: Partial<VotingPowerHistoryInsert> = {},
): VotingPowerHistoryInsert => ({
  transactionHash: TX_HASH,
  daoId: TEST_DAO,
  accountId: TEST_ACCOUNT,
  votingPower: 1000n,
  delta: 200n,
  deltaMod: 200n,
  timestamp: 1700000000n,
  logIndex: 150,
  ...overrides,
});

const createTransfer = (
  overrides: Partial<TransferInsert> = {},
): TransferInsert => ({
  transactionHash: TX_HASH,
  daoId: TEST_DAO,
  tokenId: "token-1",
  amount: 100n,
  fromAccountId: TEST_ACCOUNT,
  toAccountId: TEST_ACCOUNT_2,
  timestamp: 1700000000n,
  logIndex: 150,
  ...overrides,
});

const createDelegation = (
  overrides: Partial<DelegationInsert> = {},
): DelegationInsert => ({
  transactionHash: TX_HASH,
  daoId: TEST_DAO,
  delegateAccountId: TEST_ACCOUNT,
  delegatorAccountId: TEST_ACCOUNT_2,
  delegatedValue: 0n,
  timestamp: 1700000000n,
  logIndex: 150,
  ...overrides,
});

describe("TORNVotingPowerRepository", () => {
  let client: PGlite;
  let db: Drizzle;
  let repository: TORNVotingPowerRepository;

  beforeAll(async () => {
    client = new PGlite();
    db = drizzle(client, { schema });
    repository = new TORNVotingPowerRepository(db);

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
  });

  // The defining TORN behavior: voting power is derived directly from the
  // Transfer, so the history row shares the transfer's logIndex. The generic
  // repository's strict `<` join would drop it; this one matches on `<=`.
  it("links a transfer whose logIndex equals the row logIndex", async () => {
    await db
      .insert(votingPowerHistory)
      .values(createHistoryRow({ logIndex: 150 }));
    await db.insert(transfer).values(createTransfer({ logIndex: 150 }));

    const result = await repository.getHistoricalVotingPowers(
      0,
      10,
      "desc",
      "timestamp",
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.transfers).not.toBeNull();
    expect(result[0]!.transfers!.logIndex).toBe(150);
    expect(result[0]!.delegations).toBeNull();
  });

  it("links a delegation whose logIndex equals the row logIndex", async () => {
    await db
      .insert(votingPowerHistory)
      .values(createHistoryRow({ logIndex: 150 }));
    await db.insert(delegation).values(createDelegation({ logIndex: 150 }));

    const result = await repository.getHistoricalVotingPowers(
      0,
      10,
      "desc",
      "timestamp",
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.delegations).not.toBeNull();
    expect(result[0]!.delegations!.logIndex).toBe(150);
  });

  it("returns null relations when none share or precede the row logIndex", async () => {
    await db
      .insert(votingPowerHistory)
      .values(createHistoryRow({ logIndex: 150 }));
    // transfer in the same tx but AFTER the row is not the cause
    await db.insert(transfer).values(createTransfer({ logIndex: 151 }));

    const result = await repository.getHistoricalVotingPowers(
      0,
      10,
      "desc",
      "timestamp",
    );

    expect(result).toHaveLength(1);
    expect(result[0]!.transfers).toBeNull();
    expect(result[0]!.delegations).toBeNull();
  });

  it("filters by accountId", async () => {
    await db.insert(votingPowerHistory).values([
      createHistoryRow({ accountId: TEST_ACCOUNT, logIndex: 150 }),
      createHistoryRow({
        accountId: TEST_ACCOUNT_2,
        transactionHash:
          "0x0000000000000000000000000000000000000000000000000000000000000002",
        logIndex: 151,
      }),
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
});
