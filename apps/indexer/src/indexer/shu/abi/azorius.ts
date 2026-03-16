export const AzoriusAbi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "strategy",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "proposalId",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "address",
        name: "proposer",
        type: "address",
      },
      {
        indexed: false,
        internalType: "tuple[]",
        name: "transactions",
        type: "tuple[]",
        components: [
          { internalType: "address", name: "to", type: "address" },
          { internalType: "uint256", name: "value", type: "uint256" },
          { internalType: "bytes", name: "data", type: "bytes" },
          {
            internalType: "enum Enum.Operation",
            name: "operation",
            type: "uint8",
          },
        ],
      },
      {
        indexed: false,
        internalType: "string",
        name: "metadata",
        type: "string",
      },
    ],
    name: "ProposalCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "uint32",
        name: "proposalId",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "bytes32[]",
        name: "txHashes",
        type: "bytes32[]",
      },
    ],
    name: "ProposalExecuted",
    type: "event",
  },
] as const;
