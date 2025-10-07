import { metricTypeArray } from "@/lib/constants";
import {
  onchainTable,
  index,
  onchainEnum,
  primaryKey,
  relations,
} from "ponder";
import { Address, zeroAddress } from "viem";

export const dao = onchainTable("dao", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  quorum: drizzle.bigint().notNull().default(0n),
  proposalThreshold: drizzle.bigint("proposal_threshold").notNull().default(0n),
  votingDelay: drizzle.bigint("voting_delay").notNull().default(0n),
  votingPeriod: drizzle.bigint("voting_period").notNull().default(0n),
  timelockDelay: drizzle.bigint("timelock_delay").notNull().default(0n),
  chainId: drizzle.integer("chain_id").notNull(),
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
    lastVoteTimestamp: drizzle
      .bigint("last_vote_timestamp")
      .default(BigInt(0))
      .notNull(),
    firstVoteTimestamp: drizzle.bigint("first_vote_timestamp"),
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
      columns: [table.transactionHash, table.accountId],
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
    txHash: drizzle.text("tx_hash"),
    daoId: drizzle.text("dao_id").notNull(),
    voterAccountId: drizzle.text("voter_account_id").$type<Address>().notNull(),
    proposalId: drizzle.text("proposal_id"),
    support: drizzle.text(),
    votingPower: drizzle.text(),
    reason: drizzle.text(),
    timestamp: drizzle.bigint(),
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

// Account Power and Balance relations
export const accountBalanceRelations = relations(accountBalance, ({ one }) => ({
  // Relation to the delegate's power
  delegatePower: one(accountPower, {
    fields: [accountBalance.delegate],
    references: [accountPower.accountId],
    relationName: "delegatePower",
  }),
  account: one(account, {
    fields: [accountBalance.accountId],
    references: [account.id],
    relationName: "account",
  }),
  delegateAccount: one(account, {
    fields: [accountBalance.delegate],
    references: [account.id],
    relationName: "delegateAccount",
  }),
  delegatedTo: one(accountPower, {
    fields: [accountBalance.delegate],
    references: [accountPower.accountId],
    relationName: "delegatedTo",
  }),
  token: one(token, {
    fields: [accountBalance.tokenId],
    references: [token.id],
    relationName: "token",
  }),
}));

export const transferRelations = relations(transfer, ({ one }) => ({
  from: one(account, {
    fields: [transfer.fromAccountId],
    references: [account.id],
    relationName: "from",
  }),
  to: one(account, {
    fields: [transfer.toAccountId],
    references: [account.id],
    relationName: "to",
  }),
  token: one(token, {
    fields: [transfer.tokenId],
    references: [token.id],
    relationName: "token",
  }),
  transaction: one(transaction, {
    fields: [transfer.transactionHash],
    references: [transaction.transactionHash],
    relationName: "transactionTransfers",
  }),
}));

export const accountPowerRelations = relations(accountPower, ({ one }) => ({
  account: one(account, {
    fields: [accountPower.accountId],
    references: [account.id],
    relationName: "accountPowers",
  }),
}));

// Proposals and Votes relations
export const proposalsOnchainRelations = relations(
  proposalsOnchain,
  ({ one, many }) => ({
    votes: many(votesOnchain, {
      relationName: "proposalVotes",
    }),
    proposer: one(account, {
      fields: [proposalsOnchain.proposerAccountId],
      references: [account.id],
      relationName: "proposer",
    }),
  }),
);

export const votesOnchainRelations = relations(votesOnchain, ({ one }) => ({
  proposal: one(proposalsOnchain, {
    fields: [votesOnchain.proposalId],
    references: [proposalsOnchain.id],
    relationName: "proposalVotes",
  }),
  voter: one(account, {
    fields: [votesOnchain.voterAccountId],
    references: [account.id],
    relationName: "voter",
  }),
}));

export const delegationsRelations = relations(delegation, ({ one }) => ({
  delegate: one(account, {
    fields: [delegation.delegateAccountId],
    references: [account.id],
    relationName: "delegate",
  }),
  delegator: one(account, {
    fields: [delegation.delegatorAccountId],
    references: [account.id],
    relationName: "delegator",
  }),
  transaction: one(transaction, {
    fields: [delegation.transactionHash],
    references: [transaction.transactionHash],
    relationName: "transactionDelegations",
  }),
}));

export const votingPowerHistoryRelations = relations(
  votingPowerHistory,
  ({ one }) => ({
    transfer: one(transfer, {
      fields: [votingPowerHistory.transactionHash, votingPowerHistory.logIndex],
      references: [transfer.transactionHash, transfer.logIndex],
      relationName: "votingPowerTransfer",
    }),
    delegation: one(delegation, {
      fields: [votingPowerHistory.transactionHash, votingPowerHistory.logIndex],
      references: [delegation.transactionHash, delegation.logIndex],
      relationName: "votingPowerDelegation",
    }),
    account: one(account, {
      fields: [votingPowerHistory.accountId],
      references: [account.id],
    }),
  }),
);

export const transactionRelations = relations(transaction, ({ many }) => ({
  transfers: many(transfer, {
    relationName: "transactionTransfers",
  }),
  delegations: many(delegation, {
    relationName: "transactionDelegations",
  }),
}));

export const accountRelations = relations(account, ({ many }) => ({
  balances: many(accountBalance, {
    relationName: "accountBalances",
  }),
  powers: many(accountPower, {
    relationName: "accountPowers",
  }),
  delegationsFrom: many(delegation, {
    relationName: "delegator",
  }),
  delegationsTo: many(delegation, {
    relationName: "delegate",
  }),
  sentTransfers: many(transfer, {
    relationName: "from",
  }),
  receivedTransfers: many(transfer, {
    relationName: "to",
  }),
  proposals: many(proposalsOnchain, {
    relationName: "proposer",
  }),
  votes: many(votesOnchain, {
    relationName: "voter",
  }),
  delegatedFromBalances: many(accountBalance, {
    relationName: "delegatedBalances",
  }),
}));
