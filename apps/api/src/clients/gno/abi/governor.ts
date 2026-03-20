// TODO: replace with the actual GNO governor ABI extracted from block explorer
export const GovernorAbi = [
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
] as const;
