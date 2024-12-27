import { addressZero } from "@/lib/constants";
import { onchainTable, index, onchainEnum, primaryKey } from "ponder";

export const dao = onchainTable("dao", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  quorum: drizzle.bigint(),
  proposalThreshold: drizzle.bigint(),
  votingDelay: drizzle.bigint(),
  votingPeriod: drizzle.bigint(),
  timelockDelay: drizzle.bigint(),
}));

export const daoToken = onchainTable(
  "dao_token",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    daoId: drizzle.text().notNull(),
    tokenId: drizzle.text().notNull(),
  }),
  (table) => ({
    daoTokenDaoIdx: index().on(table.daoId),
    daoTokenTokenIdx: index().on(table.tokenId),
  })
);

export const token = onchainTable("token", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  name: drizzle.text(),
  decimals: drizzle.integer().notNull(),
  totalSupply: drizzle.bigint().notNull(),
  delegatedSupply: drizzle.bigint().notNull(),
  activeSupply180d: drizzle.bigint().notNull(),
  cexSupply: drizzle.bigint().notNull(),
  dexSupply: drizzle.bigint().notNull(),
  lendingSupply: drizzle.bigint().notNull(),
  circulatingSupply: drizzle.bigint().notNull(),
  treasury: drizzle.bigint().notNull(),
}));

export const account = onchainTable("account", (drizzle) => ({
  id: drizzle.text().primaryKey(),
}));

export const accountBalance = onchainTable(
  "account_balance",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    tokenId: drizzle.text(),
    accountId: drizzle.text(),
    balance: drizzle.bigint().notNull(),
  }),
  (table) => ({
    accountBalanceAccountIdx: index().on(table.accountId),
    accountBalanceTokenIdx: index().on(table.tokenId),
  })
);

export const accountPower = onchainTable(
  "account_power",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    accountId: drizzle.text(),
    daoId: drizzle.text(),
    votingPower: drizzle.bigint().default(BigInt(0)).notNull(),
    votesCount: drizzle.integer().default(0).notNull(),
    proposalsCount: drizzle.integer().default(0).notNull(),
    delegationsCount: drizzle.integer().default(0).notNull(),
    delegate: drizzle.text().default(addressZero).notNull(),
  }),
  (table) => ({
    accountPowerAccountIdx: index().on(table.accountId),
    accountPowerDaoIdx: index().on(table.daoId),
  })
);

export const votingPowerHistory = onchainTable(
  "voting_power_history",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    daoId: drizzle.text(),
    accountId: drizzle.text(),
    votingPower: drizzle.bigint().notNull(),
    timestamp: drizzle.bigint().notNull(),
  }),
  (table) => ({
    votingPowerHistoryAccountIdx: index().on(table.accountId),
    votingPowerHistoryDaoIdx: index().on(table.daoId),
  })
);

export const delegations = onchainTable(
  "delegations",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    daoId: drizzle.text(),
    delegateeAccountId: drizzle.text(),
    delegatorAccountId: drizzle.text(),
    timestamp: drizzle.bigint(),
  }),
  (table) => ({
    delegationsDaoIdx: index().on(table.daoId),
    delegationsDelegateeIdx: index().on(table.delegateeAccountId),
    delegationsDelegatorIdx: index().on(table.delegatorAccountId),
  })
);

export const transfers = onchainTable(
  "transfers",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    daoId: drizzle.text(),
    tokenId: drizzle.text(),
    amount: drizzle.bigint(),
    fromAccountId: drizzle.text(),
    toAccountId: drizzle.text(),
    timestamp: drizzle.bigint(),
  }),
  (table) => ({
    transfersDaoIdx: index().on(table.daoId),
    transfersTokenIdx: index().on(table.tokenId),
  })
);

export const votesOnchain = onchainTable(
  "votes_onchain",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    daoId: drizzle.text(),
    voterAccountId: drizzle.text(),
    proposalId: drizzle.text(),
    support: drizzle.text(),
    weight: drizzle.text(),
    reason: drizzle.text(),
    timestamp: drizzle.bigint(),
  }),
  (table) => ({
    votesOnchainDaoIdx: index().on(table.daoId),
    votesOnchainVoterIdx: index().on(table.voterAccountId),
    votesOnchainProposalIdx: index().on(table.proposalId),
  })
);

export const proposalsOnchain = onchainTable(
  "proposals_onchain",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    daoId: drizzle.text(),
    proposerAccountId: drizzle.text(),
    targets: drizzle.json(),
    values: drizzle.json(),
    signatures: drizzle.json(),
    calldatas: drizzle.json(),
    startBlock: drizzle.text(),
    endBlock: drizzle.text(),
    description: drizzle.text(),
    timestamp: drizzle.bigint(),
    status: drizzle.text(),
    forVotes: drizzle.bigint(),
    againstVotes: drizzle.bigint(),
    abstainVotes: drizzle.bigint(),
  }),
  (table) => ({
    proposalsOnchainDaoIdx: index().on(table.daoId),
    proposalsOnchainProposerIdx: index().on(table.proposerAccountId),
  })
);

export const metricType = onchainEnum("metricType", [
  "TOTAL_SUPPLY",
  "DELEGATED_SUPPLY",
  "ACTIVE_SUPPLY_180d",
  "CEX_SUPPLY",
  "DEX_SUPPLY",
  "LENDING_SUPPLY",
  "CIRCULATING_SUPPLY",
  "TREASURY",
]);

export const daoMetricsDayBuckets = onchainTable(
  "dao_metrics_day_buckets",
  (drizzle) => ({
    dayTimestamp: drizzle.timestamp(),
    daoId: drizzle.text().notNull(),
    tokenId: drizzle.text().notNull(),
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
      columns: [
        table.dayTimestamp,
        table.daoId,
        table.tokenId,
        table.metricType,
      ],
    }),
  })
);
