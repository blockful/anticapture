export const LinearERC20VotingAbi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "voter",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint32",
        name: "proposalId",
        type: "uint32",
      },
      {
        indexed: false,
        internalType: "uint8",
        name: "voteType",
        type: "uint8",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "weight",
        type: "uint256",
      },
    ],
    name: "Voted",
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
        internalType: "uint32",
        name: "votingEndBlock",
        type: "uint32",
      },
    ],
    name: "ProposalInitialized",
    type: "event",
  },
] as const;
