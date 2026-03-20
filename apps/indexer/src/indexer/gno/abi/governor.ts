// TODO: replace with the actual GNO governor ABI extracted from block explorer
// Scaffolded with standard OZ Governor events — verify governor type on-chain
export const GovernorAbi = [
  {
    type: "event",
    name: "ProposalCreated",
    inputs: [
      { indexed: false, name: "proposalId", type: "uint256" },
      { indexed: false, name: "proposer", type: "address" },
      { indexed: false, name: "targets", type: "address[]" },
      { indexed: false, name: "values", type: "uint256[]" },
      { indexed: false, name: "signatures", type: "string[]" },
      { indexed: false, name: "calldatas", type: "bytes[]" },
      { indexed: false, name: "startBlock", type: "uint256" },
      { indexed: false, name: "endBlock", type: "uint256" },
      { indexed: false, name: "description", type: "string" },
    ],
  },
  {
    type: "event",
    name: "VoteCast",
    inputs: [
      { indexed: true, name: "voter", type: "address" },
      { indexed: false, name: "proposalId", type: "uint256" },
      { indexed: false, name: "support", type: "uint8" },
      { indexed: false, name: "weight", type: "uint256" },
      { indexed: false, name: "reason", type: "string" },
    ],
  },
  {
    type: "event",
    name: "ProposalCanceled",
    inputs: [{ indexed: false, name: "proposalId", type: "uint256" }],
  },
  {
    type: "event",
    name: "ProposalExecuted",
    inputs: [{ indexed: false, name: "proposalId", type: "uint256" }],
  },
  {
    type: "event",
    name: "ProposalQueued",
    inputs: [
      { indexed: false, name: "proposalId", type: "uint256" },
      { indexed: false, name: "eta", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "quorum",
    stateMutability: "view",
    inputs: [{ name: "blockNumber", type: "uint256" }],
    outputs: [{ type: "uint256" }],
  },
  {
    type: "function",
    name: "timelock",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
  {
    type: "function",
    name: "token",
    stateMutability: "view",
    inputs: [],
    outputs: [{ type: "address" }],
  },
] as const;
