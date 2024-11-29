import { foreignKey, index, onchainTable } from "@ponder/core";

export const DAO = onchainTable("DAO", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  quorum: drizzle.bigint(),
  proposalThreshold: drizzle.bigint(),
  votingDelay: drizzle.bigint(),
  votingPeriod: drizzle.bigint(),
  timelockDelay: drizzle.bigint(),
}));

export const DAOToken = onchainTable("DAOToken", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  daoId: drizzle
    .text()
    .notNull(),
  tokenId: drizzle
    .text()
    .notNull(),
}));

export const Token = onchainTable("Token", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  name: drizzle.text(),
  decimals: drizzle.integer(),
  totalSupply: drizzle.bigint(),
}));
export const Account = onchainTable("Account", (drizzle) => ({
  id: drizzle.text().primaryKey(),
}));
export const AccountBalance = onchainTable("AccountBalance", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  tokenId: drizzle.text(),
  accountId: drizzle.text(),
  balance: drizzle.bigint().notNull(),
}));

export const AccountPower = onchainTable("AccountPower", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  accountId: drizzle.text(),
  daoId: drizzle.text(),
  votingPower: drizzle.bigint(),
  votesCount: drizzle.integer(),
  proposalsCount: drizzle.integer(),
  delegationsCount: drizzle.integer(),
  delegate: drizzle.text(),
}));
export const VotingPowerHistory = onchainTable(
  "VotingPowerHistory",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    daoId: drizzle.text(),
    accountId: drizzle.text(),
    votingPower: drizzle.bigint().notNull(),
    timestamp: drizzle.bigint().notNull(),
  })
);
export const Delegations = onchainTable("Delegations", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  daoId: drizzle.text(),
  delegateeAccountId: drizzle.text(),
  delegatorAccountId: drizzle.text(),
  timestamp: drizzle.bigint(),
}));

export const Transfers = onchainTable("Transfers", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  daoId: drizzle.text(),
  tokenId: drizzle.text(),
  amount: drizzle.bigint(),
  fromAccountId: drizzle.text(),
  toAccountId: drizzle.text(),
  timestamp: drizzle.bigint(),
}));
export const VotesOnchain = onchainTable("VotesOnchain", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  daoId: drizzle.text(),
  voterAccountId: drizzle.text(),
  proposalId: drizzle.text(),
  support: drizzle.text(),
  weight: drizzle.text(),
  reason: drizzle.text(),
  timestamp: drizzle.bigint(),
}));

export const ProposalsOnchain = onchainTable("ProposalsOnchain", (drizzle) => ({
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
}));
