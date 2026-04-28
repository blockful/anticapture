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
    // pg bigint max is ~9.2e18. Use 1e12 as the base unit so the largest
    // multiplier in this file (1_000_000 for supply) stays at 1e18.
    const UNIT = BigInt("1000000000000"); // 1e12
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
      votingPower: UNIT * BigInt(i + 1),
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
          totalSupply: f.default({ defaultValue: UNIT * BigInt(1_000_000) }),
          delegatedSupply: f.default({ defaultValue: UNIT * BigInt(400_000) }),
          circulatingSupply: f.default({
            defaultValue: UNIT * BigInt(800_000),
          }),
          cexSupply: f.default({ defaultValue: UNIT * BigInt(50_000) }),
          dexSupply: f.default({ defaultValue: UNIT * BigInt(30_000) }),
          lendingSupply: f.default({ defaultValue: UNIT * BigInt(20_000) }),
          nonCirculatingSupply: f.default({
            defaultValue: UNIT * BigInt(200_000),
          }),
          treasury: f.default({ defaultValue: UNIT * BigInt(100_000) }),
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
          // Realistic voting power (1–1000 tokens) and a recent last-vote
          // timestamp so getActiveSupply(90d) returns non-zero results
          votingPower: f.default({ defaultValue: UNIT * BigInt(100) }),
          lastVoteTimestamp: f.default({ defaultValue: NOW - BigInt(86_400) }),
        },
      },
      tokenPrice: {
        columns: {
          // ~$2 per token in wei-equivalent (price stored as bigint in ETH units)
          price: f.default({ defaultValue: BigInt(2_000_000_000_000_000) }),
          timestamp: f.default({ defaultValue: NOW }),
        },
      },
      votingPowerHistory: {
        columns: {
          transactionHash: f.valuesFromArray({ values: TX_HASHES }),
          daoId: f.default({ defaultValue: DAO_ID }),
          accountId: f.valuesFromArray({ values: ADDRESSES }),
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
        },
      },
      daoMetricsDayBucket: {
        columns: {
          daoId: f.default({ defaultValue: DAO_ID }),
          tokenId: f.valuesFromArray({ values: TOKEN_IDS }),
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
        },
      },
    }));
  } catch (err) {
    logger.error({ err }, "CI seed failed; aborting startup");
    throw err;
  }
}
