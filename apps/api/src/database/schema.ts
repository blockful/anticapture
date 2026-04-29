import { relations } from "drizzle-orm";
import {
  pgTable,
  index,
  bigint,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";
import { Address, zeroAddress } from "viem";

import { MetricTypesArray } from "@/lib/constants";

export const token = pgTable("token", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  name: drizzle.text(),
  decimals: drizzle.integer().notNull(),
  totalSupply: bigint("total_supply", { mode: "bigint" }).notNull().default(0n),
  delegatedSupply: bigint("delegated_supply", { mode: "bigint" })
    .notNull()
    .default(0n),
  cexSupply: bigint("cex_supply", { mode: "bigint" }).notNull().default(0n),
  dexSupply: bigint("dex_supply", { mode: "bigint" }).notNull().default(0n),
  lendingSupply: bigint("lending_supply", { mode: "bigint" })
    .notNull()
    .default(0n),
  circulatingSupply: bigint("circulating_supply", { mode: "bigint" })
    .notNull()
    .default(0n),
  treasury: bigint({ mode: "bigint" }).notNull().default(0n),
  nonCirculatingSupply: bigint("non_circulating_supply", { mode: "bigint" })
    .notNull()
    .default(0n),
}));

export const account = pgTable("account", (drizzle) => ({
  id: drizzle.text().primaryKey(),
}));

export const accountBalance = pgTable(
  "account_balance",
  (drizzle) => ({
    accountId: drizzle.text("account_id").$type<Address>().notNull(),
    tokenId: drizzle.text("token_id").notNull(),
    balance: bigint({ mode: "bigint" }).notNull(),
    // This field represents for who the account is delegating their voting power to
    delegate: drizzle.text().$type<Address>().default(zeroAddress).notNull(),
  }),
  (table) => [
    primaryKey({
      columns: [table.accountId, table.tokenId],
    }),
    index().on(table.delegate),
  ],
);

export const accountPower = pgTable(
  "account_power",
  (drizzle) => ({
    accountId: drizzle.text("account_id").$type<Address>().notNull(),
    daoId: drizzle.text("dao_id").notNull(),
    votingPower: bigint("voting_power", { mode: "bigint" })
      .default(BigInt(0))
      .notNull(),
    votesCount: drizzle.integer("votes_count").default(0).notNull(),
    proposalsCount: drizzle.integer("proposals_count").default(0).notNull(),
    delegationsCount: drizzle.integer("delegations_count").default(0).notNull(),
    lastVoteTimestamp: bigint("last_vote_timestamp", { mode: "bigint" })
      .default(BigInt(0))
      .notNull(),
  }),
  (table) => [
    primaryKey({
      columns: [table.accountId],
    }),
    index().on(table.lastVoteTimestamp),
  ],
);

export const votingPowerHistory = pgTable(
  "voting_power_history",
  (drizzle) => ({
    transactionHash: drizzle.text("transaction_hash").notNull(),
    daoId: drizzle.text("dao_id").notNull(),
    accountId: drizzle.text("account_id").$type<Address>().notNull(),
    votingPower: bigint("voting_power", { mode: "bigint" }).notNull(),
    delta: bigint({ mode: "bigint" }).notNull(),
    deltaMod: bigint("delta_mod", { mode: "bigint" }).notNull(),
    timestamp: bigint({ mode: "bigint" }).notNull(),
    logIndex: drizzle.integer("log_index").notNull(),
  }),
  (table) => [
    primaryKey({
      columns: [table.transactionHash, table.accountId, table.logIndex],
    }),
  ],
);

export const balanceHistory = pgTable(
  "balance_history",
  (drizzle) => ({
    transactionHash: drizzle.text("transaction_hash").notNull(),
    daoId: drizzle.text("dao_id").notNull(),
    accountId: drizzle.text("account_id").$type<Address>().notNull(),
    balance: bigint({ mode: "bigint" }).notNull(),
    delta: bigint({ mode: "bigint" }).notNull(),
    deltaMod: bigint("delta_mod", { mode: "bigint" }).notNull(),
    timestamp: bigint({ mode: "bigint" }).notNull(),
    logIndex: drizzle.integer("log_index").notNull(),
  }),
  (table) => [
    primaryKey({
      columns: [table.transactionHash, table.accountId, table.logIndex],
    }),
  ],
);

export const delegation = pgTable(
  "delegations",
  (drizzle) => ({
    transactionHash: drizzle.text("transaction_hash").notNull(),
    daoId: drizzle.text("dao_id").notNull(),
    delegateAccountId: drizzle
      .text("delegate_account_id")
      .$type<Address>()
      .notNull(),
    delegatorAccountId: drizzle
      .text("delegator_account_id")
      .$type<Address>()
      .notNull(),
    delegatedValue: bigint("delegated_value", { mode: "bigint" })
      .notNull()
      .default(0n),
    previousDelegate: drizzle.text("previous_delegate"),
    timestamp: bigint({ mode: "bigint" }).notNull(),
    logIndex: drizzle.integer("log_index").notNull(),
    isCex: drizzle.boolean("is_cex").notNull().default(false),
    isDex: drizzle.boolean("is_dex").notNull().default(false),
    isLending: drizzle.boolean("is_lending").notNull().default(false),
    isTotal: drizzle.boolean("is_total").notNull().default(false),
  }),
  (table) => [
    primaryKey({
      columns: [
        table.transactionHash,
        table.delegatorAccountId,
        table.delegateAccountId,
      ],
    }),
    index().on(table.transactionHash),
    index().on(table.timestamp),
    index().on(table.delegatorAccountId),
    index().on(table.delegateAccountId),
    index().on(table.delegatedValue),
  ],
);

export const transfer = pgTable(
  "transfers",
  (drizzle) => ({
    transactionHash: drizzle.text("transaction_hash").notNull(),
    daoId: drizzle.text("dao_id").notNull(),
    tokenId: drizzle.text("token_id").notNull(),
    amount: bigint({ mode: "bigint" }).notNull(),
    fromAccountId: drizzle.text("from_account_id").$type<Address>().notNull(),
    toAccountId: drizzle.text("to_account_id").$type<Address>().notNull(),
    timestamp: bigint({ mode: "bigint" }).notNull(),
    logIndex: drizzle.integer("log_index").notNull(),
    isCex: drizzle.boolean("is_cex").notNull().default(false),
    isDex: drizzle.boolean("is_dex").notNull().default(false),
    isLending: drizzle.boolean("is_lending").notNull().default(false),
    isTotal: drizzle.boolean("is_total").notNull().default(false),
  }),
  (table) => [
    primaryKey({
      columns: [table.transactionHash, table.fromAccountId, table.toAccountId],
    }),
    index().on(table.transactionHash),
    index().on(table.timestamp),
    index().on(table.fromAccountId),
    index().on(table.toAccountId),
    index().on(table.amount),
  ],
);

export const votesOnchain = pgTable(
  "votes_onchain",
  (drizzle) => ({
    txHash: drizzle.text("tx_hash").notNull(),
    daoId: drizzle.text("dao_id").notNull(),
    voterAccountId: drizzle.text("voter_account_id").$type<Address>().notNull(),
    proposalId: drizzle.text("proposal_id").notNull(),
    support: drizzle.text().notNull(),
    votingPower: bigint("voting_power", { mode: "bigint" }).notNull(),
    reason: drizzle.text(),
    timestamp: bigint({ mode: "bigint" }).notNull(),
  }),
  (table) => [
    primaryKey({
      columns: [table.voterAccountId, table.proposalId],
    }),
  ],
);

export const proposalsOnchain = pgTable(
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
    title: drizzle.text().notNull(),
    description: drizzle.text().notNull(),
    timestamp: bigint({ mode: "bigint" }).notNull(),
    endTimestamp: bigint("end_timestamp", { mode: "bigint" }).notNull(),
    status: drizzle.text().notNull(),
    forVotes: bigint("for_votes", { mode: "bigint" }).default(0n).notNull(),
    againstVotes: bigint("against_votes", { mode: "bigint" })
      .default(0n)
      .notNull(),
    abstainVotes: bigint("abstain_votes", { mode: "bigint" })
      .default(0n)
      .notNull(),
    proposalType: drizzle.integer("proposal_type"),
  }),
  (table) => [index().on(table.proposerAccountId)],
);

export const votesOnchainRelations = relations(votesOnchain, ({ one }) => ({
  proposal: one(proposalsOnchain, {
    fields: [votesOnchain.proposalId],
    references: [proposalsOnchain.id],
  }),
}));

export const metricType = pgEnum("metricType", MetricTypesArray);

export const daoMetricsDayBucket = pgTable(
  "dao_metrics_day_buckets",
  (drizzle) => ({
    date: bigint({ mode: "bigint" }).notNull(),
    daoId: drizzle.text("dao_id").notNull(),
    tokenId: drizzle.text("token_id").notNull(),
    metricType: metricType("metricType").notNull(),
    open: bigint({ mode: "bigint" }).notNull(),
    close: bigint({ mode: "bigint" }).notNull(),
    low: bigint({ mode: "bigint" }).notNull(),
    high: bigint({ mode: "bigint" }).notNull(),
    average: bigint({ mode: "bigint" }).notNull(),
    volume: bigint({ mode: "bigint" }).notNull(),
    count: drizzle.integer().notNull(),
    lastUpdate: bigint("last_update", { mode: "bigint" }).notNull(),
  }),
  (table) => [
    primaryKey({
      columns: [table.date, table.tokenId, table.metricType],
    }),
  ],
);

export const transaction = pgTable("transaction", (drizzle) => ({
  transactionHash: drizzle.text("transaction_hash").primaryKey(),
  fromAddress: drizzle.text("from_address"),
  toAddress: drizzle.text("to_address"),
  isCex: drizzle.boolean("is_cex").notNull().default(false),
  isDex: drizzle.boolean("is_dex").notNull().default(false),
  isLending: drizzle.boolean("is_lending").notNull().default(false),
  isTotal: drizzle.boolean("is_total").notNull().default(false),
  timestamp: bigint({ mode: "bigint" }).notNull(),
}));

export const tokenPrice = pgTable("token_price", (_drizzle) => ({
  price: bigint({ mode: "bigint" }).notNull(), // price in ETH
  timestamp: bigint({ mode: "bigint" }).primaryKey(),
}));

export const evenTypeEnum = pgEnum("event_type", [
  "VOTE",
  "PROPOSAL",
  "DELEGATION",
  "TRANSFER",
  "DELEGATION_VOTES_CHANGED",
  "PROPOSAL_EXTENDED",
]);

export const feedEvent = pgTable(
  "feed_event",
  (drizzle) => ({
    txHash: drizzle.text("tx_hash").notNull(),
    logIndex: drizzle.integer("log_index").notNull(),
    type: evenTypeEnum("type").notNull(),
    value: bigint({ mode: "bigint" }).notNull().default(0n),
    timestamp: bigint({ mode: "number" }).notNull(),
    metadata: drizzle.json().$type<Record<string, unknown>>(),
  }),
  (table) => [
    primaryKey({
      columns: [table.txHash, table.logIndex],
    }),
    index().on(table.timestamp),
    index().on(table.type),
    index().on(table.value),
  ],
);
