import { sql } from "drizzle-orm";
import { type NodePgDatabase } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { seed } from "drizzle-seed";

import * as schema from "@/database/schema";
import { env } from "@/env";
import { logger } from "@/logger";

export function isRailwayPreviewEnv(): boolean {
  // HACK: This will remain coupled to the raiwlay environment for now as we have no way to avoid it
  return !["dev", "production"].includes(
    process.env.RAILWAY_ENVIRONMENT_NAME || "dev",
  );
}

export async function runCiSeed(pgClient: NodePgDatabase<typeof schema>) {
  logger.info(
    "Deploying CI configuration; migrating database schema with test data seed",
  );
  try {
    await migrate(pgClient, { migrationsFolder: "./drizzle" });
    await pgClient.execute(
      sql.raw(
        `TRUNCATE anticapture.token, anticapture.account, anticapture.account_balance, anticapture.account_power, anticapture.voting_power_history, anticapture.balance_history, anticapture.delegations, anticapture.transfers, anticapture.votes_onchain, anticapture.proposals_onchain, anticapture.dao_metrics_day_buckets, anticapture.transaction, anticapture.token_price, anticapture.feed_event CASCADE`,
      ),
    );
    const ADDRESSES = Array.from(
      { length: 1000 },
      (_, i) => `0x${String(i).padStart(40, "0")}` as const,
    );
    const TX_HASHES = Array.from(
      { length: 1000 },
      (_, i) => `0x${String(i).padStart(64, "0")}` as const,
    );
    const TOKEN_IDS = ADDRESSES.slice(0, 5);
    const DAO_ID = env.DAO_ID;
    const NOW = BigInt(Math.floor(Date.now() / 1000));
    // Safe upper bound for drizzle-seed f.int() bigint columns: well under pg
    // bigint max of 9.2e18 so generated values never overflow.
    const BIGINT_MAX = BigInt("1000000000000000"); // 1e15
    const PROPOSAL_STATUSES = [
      "ACTIVE",
      "CANCELED",
      "DEFEATED",
      "SUCCEEDED",
      "QUEUED",
      "EXECUTED",
      "EXPIRED",
    ];
    const VOTE_SUPPORTS = ["FOR", "AGAINST", "ABSTAIN"];
    const FEED_EVENT_TYPES = [
      "VOTE",
      "PROPOSAL",
      "DELEGATION",
      "TRANSFER",
      "DELEGATION_VOTES_CHANGED",
      "PROPOSAL_EXTENDED",
    ];
    const PROPOSAL_IDS = Array.from(
      { length: 1000 },
      (_, i) => `proposal-${i}`,
    );

    // accountBalance and votesOnchain have composite PKs where drizzle-seed cycles
    // each column independently, producing collisions. We insert deterministic rows
    // manually and pass count:0 in the refine block below to skip them there.
    const accountBalanceRows = ADDRESSES.slice(0, 200).flatMap((accountId, i) =>
      TOKEN_IDS.map((tokenId) => ({
        accountId: accountId as `0x${string}`,
        tokenId,
        balance: BigInt(i + 1),
        delegate: ADDRESSES[i % ADDRESSES.length] as `0x${string}`,
      })),
    );
    for (let i = 0; i < accountBalanceRows.length; i += 500) {
      await pgClient
        .insert(schema.accountBalance)
        .values(accountBalanceRows.slice(i, i + 500));
    }
    const votesOnchainRows = ADDRESSES.map((voterAccountId, i) => ({
      txHash: TX_HASHES[i] as `0x${string}`,
      daoId: DAO_ID,
      voterAccountId: voterAccountId as `0x${string}`,
      proposalId: PROPOSAL_IDS[i]!,
      support: VOTE_SUPPORTS[i % VOTE_SUPPORTS.length]!,
      votingPower: BIGINT_MAX * BigInt(i + 1),
      reason: null,
      timestamp: NOW - BigInt(i * 3600),
    }));
    for (let i = 0; i < votesOnchainRows.length; i += 500) {
      await pgClient
        .insert(schema.votesOnchain)
        .values(votesOnchainRows.slice(i, i + 500));
    }

    await seed(pgClient, schema, { count: 1000 }).refine((f) => ({
      token: {
        // One token per TOKEN_ID; the first one uses DAO_ID as its name so
        // TokenRepository.getTokenPropertiesByName(daoId) finds it.
        count: TOKEN_IDS.length,
        columns: {
          id: f.valuesFromArray({ values: TOKEN_IDS, isUnique: true }),
          name: f.default({ defaultValue: DAO_ID }),
          decimals: f.default({ defaultValue: 18 }),
          totalSupply: f.int({ minValue: BIGINT_MAX, maxValue: BIGINT_MAX }),
          delegatedSupply: f.int({
            minValue: BIGINT_MAX,
            maxValue: BIGINT_MAX,
          }),
          circulatingSupply: f.int({
            minValue: BIGINT_MAX,
            maxValue: BIGINT_MAX,
          }),
          cexSupply: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          dexSupply: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          lendingSupply: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          nonCirculatingSupply: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          treasury: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
        },
      },
      account: {
        columns: {
          id: f.valuesFromArray({ values: ADDRESSES, isUnique: true }),
        },
      },
      accountBalance: { count: 0 }, // inserted manually above
      accountPower: {
        columns: {
          accountId: f.valuesFromArray({ values: ADDRESSES, isUnique: true }),
          daoId: f.default({ defaultValue: DAO_ID }),
          // Realistic voting power and a recent last-vote timestamp so
          // getActiveSupply(90d) returns non-zero results
          votingPower: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          lastVoteTimestamp: f.int({
            minValue: NOW - BigInt(86_400),
            maxValue: NOW,
          }),
        },
      },
      tokenPrice: {
        columns: {
          price: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          timestamp: f.int({ minValue: NOW - BigInt(86_400), maxValue: NOW }),
        },
      },
      votingPowerHistory: {
        columns: {
          transactionHash: f.valuesFromArray({ values: TX_HASHES }),
          daoId: f.default({ defaultValue: DAO_ID }),
          accountId: f.valuesFromArray({ values: ADDRESSES }),
          votingPower: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          delta: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          deltaMod: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          // logIndex=0 on all rows so the join in getHistoricalVotingPowers
          // (votingPowerHistory.logIndex < delegation/transfer.logIndex) resolves
          logIndex: f.default({ defaultValue: 0 }),
        },
      },
      balanceHistory: {
        columns: {
          transactionHash: f.valuesFromArray({ values: TX_HASHES }),
          daoId: f.default({ defaultValue: DAO_ID }),
          accountId: f.valuesFromArray({ values: ADDRESSES }),
          balance: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          delta: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          deltaMod: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          // logIndex=0 matches transfer rows so the inner join in
          // getHistoricalBalances produces results instead of an empty set
          logIndex: f.default({ defaultValue: 0 }),
        },
      },
      delegation: {
        columns: {
          transactionHash: f.valuesFromArray({ values: TX_HASHES }),
          daoId: f.default({ defaultValue: DAO_ID }),
          delegateAccountId: f.valuesFromArray({ values: ADDRESSES }),
          delegatorAccountId: f.valuesFromArray({ values: ADDRESSES }),
          previousDelegate: f.valuesFromArray({ values: ADDRESSES }),
          delegatedValue: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          logIndex: f.default({ defaultValue: 0 }),
        },
      },
      transfer: {
        columns: {
          transactionHash: f.valuesFromArray({ values: TX_HASHES }),
          daoId: f.default({ defaultValue: DAO_ID }),
          tokenId: f.valuesFromArray({ values: TOKEN_IDS }),
          fromAccountId: f.valuesFromArray({ values: ADDRESSES }),
          toAccountId: f.valuesFromArray({ values: ADDRESSES }),
          amount: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          logIndex: f.default({ defaultValue: 0 }),
        },
      },
      votesOnchain: { count: 0 }, // inserted manually above
      proposalsOnchain: {
        columns: {
          id: f.valuesFromArray({ values: PROPOSAL_IDS, isUnique: true }),
          txHash: f.valuesFromArray({ values: TX_HASHES }),
          daoId: f.default({ defaultValue: DAO_ID }),
          proposerAccountId: f.valuesFromArray({ values: ADDRESSES }),
          status: f.valuesFromArray({ values: PROPOSAL_STATUSES }),
          targets: f.default({ defaultValue: [] }),
          values: f.default({ defaultValue: [] }),
          signatures: f.default({ defaultValue: [] }),
          calldatas: f.default({ defaultValue: [] }),
          // Realistic Unix seconds so Number(timestamp) fits in a 32-bit signed
          // int — drizzle-seed's default bigint range overflows GraphQL Int
          timestamp: f.default({ defaultValue: BigInt(1_700_000_000) }),
          endTimestamp: f.default({ defaultValue: BigInt(1_700_604_800) }),
          forVotes: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          againstVotes: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          abstainVotes: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
        },
      },
      daoMetricsDayBucket: {
        columns: {
          daoId: f.default({ defaultValue: DAO_ID }),
          tokenId: f.valuesFromArray({ values: TOKEN_IDS }),
          open: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          close: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          low: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          high: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          average: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
          volume: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
        },
      },
      transaction: {
        columns: {
          transactionHash: f.valuesFromArray({
            values: TX_HASHES,
            isUnique: true,
          }),
          fromAddress: f.valuesFromArray({ values: ADDRESSES }),
          toAddress: f.valuesFromArray({ values: ADDRESSES }),
        },
      },
      feedEvent: {
        columns: {
          txHash: f.valuesFromArray({ values: TX_HASHES }),
          type: f.valuesFromArray({ values: FEED_EVENT_TYPES }),
          value: f.int({ minValue: 1n, maxValue: BIGINT_MAX }),
        },
      },
    }));
  } catch (err) {
    logger.error({ err }, "CI seed failed; aborting startup");
    throw err;
  }
}
