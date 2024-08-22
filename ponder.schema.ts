import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
  Delegation: p.createTable({
    id: p.string(),
    delegatee: p.string().references("Account.id"),
    delegator: p.string().references("Account.id"),
    timestamp: p.bigint(),
  }),
  DelegationCount: p.createTable({
    id: p.string(),
    votingPower: p.bigint(),
    delegationsReceived: p.int(),
  }),
  Transfer: p.createTable({
    id: p.string(),
    amount: p.bigint(),
    from: p.string().references("Account.id"),
    to: p.string().references("Account.id"),
    timestamp: p.bigint(),
  }),
  VoteCast: p.createTable({
    id: p.string(),
    voter: p.string().references("Account.id"),
    proposalId: p.string().references("ProposalCreated.id"),
    support: p.string(),
    weight: p.string(),
    reason: p.string(),
    timestamp: p.bigint(),
  }),
  ProposalCreated: p.createTable({
    id: p.string(),
    proposer: p.string(),
    targets: p.json(),
    values: p.json(),
    signatures: p.json(),
    calldatas: p.json(),
    startBlock: p.string(),
    endBlock: p.string(),
    description: p.string(),
    timestamp: p.bigint(),
    status: p.string(),
  }),
  Account: p.createTable({
    id: p.string(),
    votingPower: p.bigint().optional(),
    balance: p.bigint().optional(),
    votesCount: p.int().optional(),
    proposalCount: p.int().optional(),
    delegationsCount: p.int().optional(),
  }),
}));
