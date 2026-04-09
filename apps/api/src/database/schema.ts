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

export const token = pgTable("Token", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  name: drizzle.text(),
  decimals: drizzle.integer().notNull(),
  totalSupply: bigint("totalSupply", { mode: "bigint" }).notNull().default(0n),
  delegatedSupply: bigint("delegatedSupply", { mode: "bigint" })
    .notNull()
    .default(0n),
  cexSupply: bigint("cexSupply", { mode: "bigint" }).notNull().default(0n),
  dexSupply: bigint("dexSupply", { mode: "bigint" }).notNull().default(0n),
  lendingSupply: bigint("lendingSupply", { mode: "bigint" })
    .notNull()
    .default(0n),
  circulatingSupply: bigint("circulatingSupply", { mode: "bigint" })
    .notNull()
    .default(0n),
  treasury: bigint({ mode: "bigint" }).notNull().default(0n),
  nonCirculatingSupply: bigint("nonCirculatingSupply", { mode: "bigint" })
    .notNull()
    .default(0n),
}));

export const account = pgTable("Account", (drizzle) => ({
  id: drizzle.text().primaryKey(),
}));

export const accountBalance = pgTable(
  "AccountBalance",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    accountId: drizzle.text("accountId").$type<Address>().notNull(),
    tokenId: drizzle.text("tokenId").notNull(),
    balance: bigint({ mode: "bigint" }).notNull(),
    delegate: drizzle.text().$type<Address>().default(zeroAddress).notNull(),
  }),
  (table) => [index().on(table.delegate)],
);

export const accountPower = pgTable(
  "AccountPower",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    accountId: drizzle.text("accountId").$type<Address>().notNull(),
    daoId: drizzle.text("daoId").notNull(),
    votingPower: bigint("votingPower", { mode: "bigint" })
      .default(BigInt(0))
      .notNull(),
    votesCount: drizzle.integer("votesCount").default(0).notNull(),
    proposalsCount: drizzle.integer("proposalsCount").default(0).notNull(),
    delegationsCount: drizzle.integer("delegationsCount").default(0).notNull(),
    lastVoteTimestamp: bigint("lastVoteTimestamp", { mode: "bigint" })
      .default(BigInt(0))
      .notNull(),
  }),
  (table) => [index().on(table.lastVoteTimestamp)],
);

export const votingPowerHistory = pgTable(
  "VotingPowerHistory",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    transactionHash: drizzle.text("transactionHash").notNull(),
    daoId: drizzle.text("daoId").notNull(),
    accountId: drizzle.text("accountId").$type<Address>().notNull(),
    votingPower: bigint("votingPower", { mode: "bigint" }).notNull(),
    delta: bigint({ mode: "bigint" }).notNull(),
    deltaMod: bigint("deltaMod", { mode: "bigint" }).notNull(),
    timestamp: bigint({ mode: "bigint" }).notNull(),
    logIndex: drizzle.integer("logIndex").notNull(),
  }),
);

export const balanceHistory = pgTable(
  "BalanceHistory",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    transactionHash: drizzle.text("transactionHash").notNull(),
    daoId: drizzle.text("daoId").notNull(),
    accountId: drizzle.text("accountId").$type<Address>().notNull(),
    balance: bigint({ mode: "bigint" }).notNull(),
    delta: bigint({ mode: "bigint" }).notNull(),
    deltaMod: bigint("deltaMod", { mode: "bigint" }).notNull(),
    timestamp: bigint({ mode: "bigint" }).notNull(),
    logIndex: drizzle.integer("logIndex").notNull(),
  }),
);

export const delegation = pgTable(
  "Delegation",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    transactionHash: drizzle.text("transactionHash").notNull(),
    daoId: drizzle.text("daoId").notNull(),
    delegateAccountId: drizzle
      .text("delegateAccountId")
      .$type<Address>()
      .notNull(),
    delegatorAccountId: drizzle
      .text("delegatorAccountId")
      .$type<Address>()
      .notNull(),
    delegatedValue: bigint("delegatedValue", { mode: "bigint" })
      .notNull()
      .default(0n),
    previousDelegate: drizzle.text("previousDelegate"),
    timestamp: bigint({ mode: "bigint" }).notNull(),
    logIndex: drizzle.integer("logIndex").notNull(),
    isCex: drizzle.boolean("isCex").notNull().default(false),
    isDex: drizzle.boolean("isDex").notNull().default(false),
    isLending: drizzle.boolean("isLending").notNull().default(false),
    isTotal: drizzle.boolean("isTotal").notNull().default(false),
  }),
  (table) => [
    index().on(table.transactionHash),
    index().on(table.timestamp),
    index().on(table.delegatorAccountId),
    index().on(table.delegateAccountId),
    index().on(table.delegatedValue),
  ],
);

export const transfer = pgTable(
  "Transfer",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    transactionHash: drizzle.text("transactionHash").notNull(),
    daoId: drizzle.text("daoId").notNull(),
    tokenId: drizzle.text("tokenId").notNull(),
    amount: bigint({ mode: "bigint" }).notNull(),
    fromAccountId: drizzle.text("fromAccountId").$type<Address>().notNull(),
    toAccountId: drizzle.text("toAccountId").$type<Address>().notNull(),
    timestamp: bigint({ mode: "bigint" }).notNull(),
    logIndex: drizzle.integer("logIndex").notNull(),
    isCex: drizzle.boolean("isCex").notNull().default(false),
    isDex: drizzle.boolean("isDex").notNull().default(false),
    isLending: drizzle.boolean("isLending").notNull().default(false),
    isTotal: drizzle.boolean("isTotal").notNull().default(false),
  }),
  (table) => [
    index().on(table.transactionHash),
    index().on(table.timestamp),
    index().on(table.fromAccountId),
    index().on(table.toAccountId),
    index().on(table.amount),
  ],
);

export const votesOnchain = pgTable(
  "VoteOnchain",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    txHash: drizzle.text("txHash").notNull(),
    daoId: drizzle.text("daoId").notNull(),
    voterAccountId: drizzle.text("voterAccountId").$type<Address>().notNull(),
    proposalId: drizzle.text("proposalId").notNull(),
    support: drizzle.text().notNull(),
    votingPower: bigint("votingPower", { mode: "bigint" }).notNull(),
    reason: drizzle.text(),
    timestamp: bigint({ mode: "bigint" }).notNull(),
  }),
);

export const proposalsOnchain = pgTable(
  "ProposalOnchain",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    txHash: drizzle.text("txHash").notNull(),
    daoId: drizzle.text("daoId").notNull(),
    proposerAccountId: drizzle
      .text("proposerAccountId")
      .$type<Address>()
      .notNull(),
    targets: drizzle.json().$type<string[]>().notNull(),
    values: drizzle.json().$type<bigint[]>().notNull(),
    signatures: drizzle.json().$type<string[]>().notNull(),
    calldatas: drizzle.json().$type<string[]>().notNull(),
    startBlock: drizzle.integer("startBlock").notNull(),
    endBlock: drizzle.integer("endBlock").notNull(),
    title: drizzle.text().notNull(),
    description: drizzle.text().notNull(),
    timestamp: bigint({ mode: "bigint" }).notNull(),
    endTimestamp: bigint("endTimestamp", { mode: "bigint" }).notNull(),
    status: drizzle.text().notNull(),
    forVotes: bigint("forVotes", { mode: "bigint" }).default(0n).notNull(),
    againstVotes: bigint("againstVotes", { mode: "bigint" })
      .default(0n)
      .notNull(),
    abstainVotes: bigint("abstainVotes", { mode: "bigint" })
      .default(0n)
      .notNull(),
    proposalType: drizzle.integer("proposalType"),
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
  "DaoMetricsDayBucket",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    date: bigint({ mode: "bigint" }).notNull(),
    daoId: drizzle.text("daoId").notNull(),
    tokenId: drizzle.text("tokenId").notNull(),
    metricType: metricType("metricType").notNull(),
    open: bigint({ mode: "bigint" }).notNull(),
    close: bigint({ mode: "bigint" }).notNull(),
    low: bigint({ mode: "bigint" }).notNull(),
    high: bigint({ mode: "bigint" }).notNull(),
    average: bigint({ mode: "bigint" }).notNull(),
    volume: bigint({ mode: "bigint" }).notNull(),
    count: drizzle.integer().notNull(),
    lastUpdate: bigint("lastUpdate", { mode: "bigint" }).notNull(),
  }),
);

export const transaction = pgTable("Transaction", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  transactionHash: drizzle.text("transactionHash").notNull(),
  fromAddress: drizzle.text("fromAddress"),
  toAddress: drizzle.text("toAddress"),
  isCex: drizzle.boolean("isCex").notNull().default(false),
  isDex: drizzle.boolean("isDex").notNull().default(false),
  isLending: drizzle.boolean("isLending").notNull().default(false),
  isTotal: drizzle.boolean("isTotal").notNull().default(false),
  timestamp: bigint({ mode: "bigint" }).notNull(),
}));

export const tokenPrice = pgTable("TokenPrice", (_drizzle) => ({
  id: _drizzle.text().primaryKey(),
  price: bigint({ mode: "bigint" }).notNull(),
  timestamp: bigint({ mode: "bigint" }).notNull(),
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
  "FeedEvent",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    txHash: drizzle.text("txHash").notNull(),
    logIndex: drizzle.integer("logIndex").notNull(),
    type: evenTypeEnum("type").notNull(),
    value: bigint({ mode: "bigint" }).notNull().default(0n),
    timestamp: bigint({ mode: "number" }).notNull(),
    metadata: drizzle.json().$type<Record<string, unknown>>(),
  }),
  (table) => [
    index().on(table.timestamp),
    index().on(table.type),
    index().on(table.value),
  ],
);
