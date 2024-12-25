import { onchainTable, index } from "ponder";

export const DAO = onchainTable("DAO", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  quorum: drizzle.bigint(),
  proposalThreshold: drizzle.bigint(),
  votingDelay: drizzle.bigint(),
  votingPeriod: drizzle.bigint(),
  timelockDelay: drizzle.bigint(),
}));

export const DAOToken = onchainTable(
  "DAOToken",
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

export const Token = onchainTable("Token", (drizzle) => ({
  id: drizzle.text().primaryKey(),
  name: drizzle.text(),
  decimals: drizzle.integer(),
  totalSupply: drizzle.bigint(),
  delegatedSupply: drizzle.bigint().notNull(),
}));
export const Account = onchainTable("Account", (drizzle) => ({
  id: drizzle.text().primaryKey(),
}));
export const AccountBalance = onchainTable(
  "AccountBalance",
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

export const AccountPower = onchainTable(
  "AccountPower",
  (drizzle) => ({
    id: drizzle.text().primaryKey(),
    accountId: drizzle.text(),
    daoId: drizzle.text(),
    votingPower: drizzle.bigint(),
    votesCount: drizzle.integer(),
    proposalsCount: drizzle.integer(),
    delegationsCount: drizzle.integer(),
    delegate: drizzle.text(),
  }),
  (table) => ({
    accountPowerAccountIdx: index().on(table.accountId),
    accountPowerDaoIdx: index().on(table.daoId),
  })
);
export const VotingPowerHistory = onchainTable(
  "VotingPowerHistory",
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
export const Delegations = onchainTable(
  "Delegations",
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

export const Transfers = onchainTable(
  "Transfers",
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
export const VotesOnchain = onchainTable(
  "VotesOnchain",
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

export const ProposalsOnchain = onchainTable(
  "ProposalsOnchain",
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
