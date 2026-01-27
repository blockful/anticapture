import { metricTypeArray } from "@/lib/constants";
import {
  onchainTable,
  index,
  onchainEnum,
  primaryKey,
  relations,
} from "ponder";
import { Address, zeroAddress } from "viem";

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
    accountId: drizzle.text("account_id").$type<Address>().notNull(),
    tokenId: drizzle.text("token_id").notNull(),
    balance: drizzle.bigint().notNull(),
    // This field represents for who the account is delegating their voting power to
    delegate: drizzle.text().default(zeroAddress).notNull(),
  }),
  (table) => ({
    pk: primaryKey({
      columns: [table.accountId, table.tokenId],
    }),
    accountBalanceDelegateIdx: index().on(table.delegate),
  }),
);

export const accountPower = onchainTable(
  "account_power",
  (drizzle) => ({
    accountId: drizzle.text("account_id").$type<Address>().notNull(),
    daoId: drizzle.text("dao_id").notNull(),
    votingPower: drizzle.bigint("voting_power").default(BigInt(0)).notNull(),
    votesCount: drizzle.integer("votes_count").default(0).notNull(),
    proposalsCount: drizzle.integer("proposals_count").default(0).notNull(),
    delegationsCount: drizzle.integer("delegations_count").default(0).notNull(),
    lastVoteTimestamp: drizzle
      .bigint("last_vote_timestamp")
      .default(BigInt(0))
      .notNull(),
  }),
  (table) => ({
    pk: primaryKey({
      columns: [table.accountId],
    }),
    lastVoteTimestamp: index().on(table.lastVoteTimestamp),
  }),
);

export const votingPowerHistory = onchainTable(
  "voting_power_history",
  (drizzle) => ({
    transactionHash: drizzle.text("transaction_hash").notNull(),
    daoId: drizzle.text("dao_id").notNull(),
    accountId: drizzle.text("account_id").$type<Address>().notNull(),
    votingPower: drizzle.bigint("voting_power").notNull(),
    delta: drizzle.bigint("delta").notNull(),
    deltaMod: drizzle.bigint("delta_mod").notNull(),
    timestamp: drizzle.bigint().notNull(),
    logIndex: drizzle.integer("log_index").notNull(),
  }),
  (table) => ({
    pk: primaryKey({
      columns: [table.transactionHash, table.accountId, table.logIndex],
    }),
  }),
);

export const delegation = onchainTable(
  "delegations",
  (drizzle) => ({
    transactionHash: drizzle.text("transaction_hash").notNull(),
    daoId: drizzle.text("dao_id").notNull(),
    delegateAccountId: drizzle.text("delegate_account_id").notNull(),
    delegatorAccountId: drizzle.text("delegator_account_id").notNull(),
    delegatedValue: drizzle.bigint("delegated_value").notNull().default(0n),
    previousDelegate: drizzle.text("previous_delegate"),
    timestamp: drizzle.bigint().notNull(),
    logIndex: drizzle.integer("log_index").notNull(),
    isCex: drizzle.boolean().notNull().default(false),
    isDex: drizzle.boolean().notNull().default(false),
    isLending: drizzle.boolean().notNull().default(false),
    isTotal: drizzle.boolean().notNull().default(false),
  }),
  (table) => ({
    pk: primaryKey({
      columns: [
        table.transactionHash,
        table.delegatorAccountId,
        table.delegateAccountId,
      ],
    }),
    delegationTransactionHashIdx: index().on(table.transactionHash),
    delegationTimestampIdx: index().on(table.timestamp),
    delegationDelegatorAccountIdIdx: index().on(table.delegatorAccountId),
    delegationDelegateAccountIdIdx: index().on(table.delegateAccountId),
    delegationDelegatedValueIdx: index().on(table.delegatedValue),
  }),
);

export const transfer = onchainTable(
  "transfers",
  (drizzle) => ({
    transactionHash: drizzle.text("transaction_hash").notNull(),
    daoId: drizzle.text("dao_id").notNull(),
    tokenId: drizzle.text("token_id").notNull(),
    amount: drizzle.bigint().notNull(),
    fromAccountId: drizzle.text("from_account_id").$type<Address>().notNull(),
    toAccountId: drizzle.text("to_account_id").$type<Address>().notNull(),
    timestamp: drizzle.bigint().notNull(),
    logIndex: drizzle.integer("log_index").notNull(),
    isCex: drizzle.boolean().notNull().default(false),
    isDex: drizzle.boolean().notNull().default(false),
    isLending: drizzle.boolean().notNull().default(false),
    isTotal: drizzle.boolean().notNull().default(false),
  }),
  (table) => ({
    pk: primaryKey({
      columns: [table.transactionHash, table.fromAccountId, table.toAccountId],
    }),
    transferTransactionHashIdx: index().on(table.transactionHash),
    transferTimestampIdx: index().on(table.timestamp),
    transferFromAccountIdIdx: index().on(table.fromAccountId),
    transferToAccountIdIdx: index().on(table.toAccountId),
    transferAmountIdx: index().on(table.amount),
  }),
);

export const votesOnchain = onchainTable(
  "votes_onchain",
  (drizzle) => ({
    txHash: drizzle.text("tx_hash").notNull(),
    daoId: drizzle.text("dao_id").notNull(),
    voterAccountId: drizzle.text("voter_account_id").$type<Address>().notNull(),
    proposalId: drizzle.text("proposal_id").notNull(),
    support: drizzle.text().notNull(),
    votingPower: drizzle.bigint().notNull(),
    reason: drizzle.text(),
    timestamp: drizzle.bigint().notNull(),
  }),
  (table) => ({
    pk: primaryKey({
      columns: [table.voterAccountId, table.proposalId],
    }),
  }),
);

export const proposalsOnchain = onchainTable(
  "proposals_onchain",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    txHash: drizzle.text("tx_hash").notNull(),
    daoId: drizzle.text("dao_id").notNull(),
    proposerAccountId: drizzle
      .text("proposer_account_id")
      .$type<Address>()
      .notNull(),
    targets: drizzle.json().$type<string[]>().notNull(),
    values: drizzle.json().$type<bigint[]>().notNull(),
    signatures: drizzle.json().$type<string[]>().notNull(),
    calldatas: drizzle.json().$type<string[]>().notNull(),
    startBlock: drizzle.integer("start_block").notNull(),
    endBlock: drizzle.integer("end_block").notNull(),
    description: drizzle.text().notNull(),
    timestamp: drizzle.bigint().notNull(),
    endTimestamp: drizzle.bigint("end_timestamp").notNull(),
    status: drizzle.text().notNull(),
    forVotes: drizzle.bigint("for_votes").default(0n).notNull(),
    againstVotes: drizzle.bigint("against_votes").default(0n).notNull(),
    abstainVotes: drizzle.bigint("abstain_votes").default(0n).notNull(),
    proposalType: drizzle.integer("proposal_type"),
  }),
  (table) => ({
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
    lastUpdate: drizzle.bigint().notNull(),
  }),
  (table) => ({
    pk: primaryKey({
      columns: [table.date, table.tokenId, table.metricType],
    }),
  }),
);

export const transaction = onchainTable("transaction", (drizzle) => ({
  transactionHash: drizzle.text("transaction_hash").primaryKey(),
  fromAddress: drizzle.text("from_address"),
  toAddress: drizzle.text("to_address"),
  isCex: drizzle.boolean().notNull().default(false),
  isDex: drizzle.boolean().notNull().default(false),
  isLending: drizzle.boolean().notNull().default(false),
  isTotal: drizzle.boolean().notNull().default(false),
  timestamp: drizzle.bigint().notNull(),
}));

export const tokenPrice = onchainTable("token_price", (drizzle) => ({
  price: drizzle.bigint().notNull(), // price in ETH
  timestamp: drizzle.bigint().primaryKey(),
}));
