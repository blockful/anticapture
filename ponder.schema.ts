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
}));
