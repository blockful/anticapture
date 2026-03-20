// TODO: replace with the actual GNO token ABI extracted from block explorer
// GNO uses standard ERC20Votes — verify on-chain before replacing
export const TokenAbi = [
  {
    type: "event",
    name: "Transfer",
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
  },
  {
    type: "event",
    name: "DelegateChanged",
    inputs: [
      { indexed: true, name: "delegator", type: "address" },
      { indexed: true, name: "fromDelegate", type: "address" },
      { indexed: true, name: "toDelegate", type: "address" },
    ],
  },
  {
    type: "event",
    name: "DelegateVotesChanged",
    inputs: [
      { indexed: true, name: "delegate", type: "address" },
      { indexed: false, name: "previousBalance", type: "uint256" },
      { indexed: false, name: "newBalance", type: "uint256" },
    ],
  },
] as const;
