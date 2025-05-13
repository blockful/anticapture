import { metricTypeArray } from "@/lib/constants";
import { onchainTable, index, onchainEnum, primaryKey } from "ponder";
import { zeroAddress } from "viem";

export const dao = onchainTable("dao", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  quorum: drizzle.bigint().notNull().default(0n),
  proposalThreshold: drizzle.bigint("proposal_threshold").notNull().default(0n),
  votingDelay: drizzle.bigint("voting_delay").notNull().default(0n),
  votingPeriod: drizzle.bigint("voting_period").notNull().default(0n),
  timelockDelay: drizzle.bigint("timelock_delay").notNull().default(0n),
}));

export const token = onchainTable("token", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  name: drizzle.text(),
  decimals: drizzle.integer().notNull(),
  totalSupply: drizzle.bigint("total_supply").notNull().default(0n),
  delegatedSupply: drizzle.bigint("delegated_supply").notNull().default(0n),
  cexSupply: drizzle.bigint("cex_supply").notNull().default(0n),
  dexSupply: drizzle.bigint("dex_supply").notNull().default(0n),
  lendingSupply: drizzle.bigint("lending_supply").notNull().default(0n),
  circulatingSupply: drizzle.bigint("circulating_supply").notNull().default(0n),
  treasury: drizzle.bigint().notNull().default(0n),
}));

export const account = onchainTable("account", (drizzle) => ({
  id: drizzle.text().primaryKey(),
}));

export const accountBalance = onchainTable(
  "account_balance",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    tokenId: drizzle.text("token_id"),
    accountId: drizzle.text("account_id"),
    balance: drizzle.bigint().notNull(),
  }),
  (table) => ({
    accountBalanceAccountIdx: index().on(table.accountId),
    accountBalanceTokenIdx: index().on(table.tokenId),
  }),
);

export const accountPower = onchainTable(
  "account_power",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    accountId: drizzle.text("account_id"),
    daoId: drizzle.text("dao_id"),
    votingPower: drizzle.bigint("voting_power").default(BigInt(0)).notNull(),
    votesCount: drizzle.integer("votes_count").default(0).notNull(),
    proposalsCount: drizzle.integer("proposals_count").default(0).notNull(),
    delegationsCount: drizzle.integer("delegations_count").default(0).notNull(),
    delegate: drizzle.text().default(zeroAddress).notNull(),
    lastVoteTimestamp: drizzle
      .bigint("last_vote_timestamp")
      .default(BigInt(0))
      .notNull(),
  }),
  (table) => ({
    accountPowerAccountIdx: index().on(table.accountId),
    accountPowerDaoIdx: index().on(table.daoId),
    lastVoteTimestamp: index().on(table.lastVoteTimestamp),
  }),
);

export const votingPowerHistory = onchainTable(
  "voting_power_history",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    daoId: drizzle.text("dao_id"),
    accountId: drizzle.text("account_id"),
    votingPower: drizzle.bigint("voting_power").notNull(),
    timestamp: drizzle.bigint().notNull(),
  }),
  (table) => ({
    votingPowerHistoryAccountIdx: index().on(table.accountId),
    votingPowerHistoryDaoIdx: index().on(table.daoId),
  }),
);

export const delegation = onchainTable(
  "delegations",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    daoId: drizzle.text("dao_id"),
    delegateeAccountId: drizzle.text("delegatee_account_id"),
    delegatorAccountId: drizzle.text("delegator_account_id"),
    timestamp: drizzle.bigint(),
  }),
  (table) => ({
    delegationsDaoIdx: index().on(table.daoId),
    delegationsDelegateeIdx: index().on(table.delegateeAccountId),
    delegationsDelegatorIdx: index().on(table.delegatorAccountId),
  }),
);

export const transfer = onchainTable(
  "transfers",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    daoId: drizzle.text("dao_id"),
    tokenId: drizzle.text("token_id"),
    amount: drizzle.bigint(),
    fromAccountId: drizzle.text("from_account_id"),
    toAccountId: drizzle.text("to_account_id"),
    timestamp: drizzle.bigint(),
  }),
  (table) => ({
    transfersDaoIdx: index().on(table.daoId),
    transfersTokenIdx: index().on(table.tokenId),
  }),
);

export const votesOnchain = onchainTable(
  "votes_onchain",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    daoId: drizzle.text("dao_id"),
    voterAccountId: drizzle.text("voter_account_id"),
    proposalId: drizzle.text("proposal_id"),
    support: drizzle.text(),
    weight: drizzle.text(),
    reason: drizzle.text(),
    timestamp: drizzle.bigint(),
  }),
  (table) => ({
    votesOnchainDaoIdx: index().on(table.daoId),
    votesOnchainVoterIdx: index().on(table.voterAccountId),
    votesOnchainProposalIdx: index().on(table.proposalId),
  }),
);

export const proposalsOnchain = onchainTable(
  "proposals_onchain",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    daoId: drizzle.text("dao_id"),
    proposerAccountId: drizzle.text("proposer_account_id"),
    targets: drizzle.json(),
    values: drizzle.json(),
    signatures: drizzle.json(),
    calldatas: drizzle.json(),
    startBlock: drizzle.text("start_block"),
    endBlock: drizzle.text("end_block"),
    description: drizzle.text(),
    timestamp: drizzle.bigint(),
    status: drizzle.text(),
    forVotes: drizzle.bigint("for_votes"),
    againstVotes: drizzle.bigint("against_votes"),
    abstainVotes: drizzle.bigint("abstain_votes"),
  }),
  (table) => ({
    proposalsOnchainDaoIdx: index().on(table.daoId),
    proposalsOnchainProposerIdx: index().on(table.proposerAccountId),
  }),
);

export const metricType = onchainEnum(
  "metricType",
  metricTypeArray as [string, ...string[]],
);

export const daoMetricsDayBucket = onchainTable(
  "dao_metrics_day_buckets",
  (drizzle) => ({
    date: drizzle.bigint().notNull(),
    daoId: drizzle.text("dao_id").notNull(),
    tokenId: drizzle.text("token_id").notNull(),
    metricType: metricType("metricType").notNull(),
    open: drizzle.bigint().notNull(),
    close: drizzle.bigint().notNull(),
    low: drizzle.bigint().notNull(),
    high: drizzle.bigint().notNull(),
    average: drizzle.bigint().notNull(),
    volume: drizzle.bigint().notNull(),
    count: drizzle.integer().notNull(),
  }),
  (table) => ({
    pk: primaryKey({
      columns: [table.date, table.daoId, table.tokenId, table.metricType],
    }),
  }),
);
