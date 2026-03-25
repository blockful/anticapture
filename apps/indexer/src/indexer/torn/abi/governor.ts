export const TORNGovernorAbi = [
  {
    type: "event",
    name: "ProposalCreated",
    inputs: [
      { indexed: true, name: "id", type: "uint256" },
      { indexed: true, name: "proposer", type: "address" },
      { indexed: false, name: "target", type: "address" },
      { indexed: false, name: "startTime", type: "uint256" },
      { indexed: false, name: "endTime", type: "uint256" },
      { indexed: false, name: "description", type: "string" },
    ],
  },
  {
    type: "event",
    name: "Voted",
    inputs: [
      { indexed: true, name: "proposalId", type: "uint256" },
      { indexed: true, name: "voter", type: "address" },
      { indexed: true, name: "support", type: "bool" },
      { indexed: false, name: "votes", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "ProposalExecuted",
    inputs: [{ indexed: true, name: "proposalId", type: "uint256" }],
  },
  {
    type: "event",
    name: "Delegated",
    inputs: [
      { indexed: true, name: "account", type: "address" },
      { indexed: true, name: "to", type: "address" },
    ],
  },
  {
    type: "event",
    name: "Undelegated",
    inputs: [
      { indexed: true, name: "account", type: "address" },
      { indexed: true, name: "from", type: "address" },
    ],
  },
] as const;
