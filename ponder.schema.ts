import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
  Delegation: p.createTable({
    id: p.string(),
    delegatee: p.string().optional(),
    delegator: p.string().optional(),
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
    from: p.string().optional(),
    to: p.string().optional(),
    timestamp: p.bigint(),
  }),
  VoteCast: p.createTable({
    id: p.string(),
    voter: p.string().optional(),
    proposalId: p.string().optional(),
    support: p.string().optional(),
    weight: p.string().optional(),
    reason: p.string().optional(),
    timestamp: p.bigint(),
  }),
  ProposalCreated: p.createTable({
    id: p.string(),
    proposalId: p.string().optional(),
    proposer: p.string().optional(),
    targets: p.json().optional(),
    values: p.json().optional(),
    signatures: p.json().optional(),
    calldatas: p.json().optional(),
    startBlock: p.string().optional(),
    endBlock: p.string().optional(),
    description: p.string().optional(),
    timestamp: p.bigint(),
    status: p.string(),
  }),
}));
