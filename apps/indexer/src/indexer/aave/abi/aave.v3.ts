export const V3AaveAbi = [
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "delegator",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "delegatee",
        type: "address",
      },
      {
        indexed: false,
        internalType:
          "enum IGovernancePowerDelegationToken.GovernancePowerType",
        name: "delegationType",
        type: "uint8",
      },
    ],
    name: "DelegateChanged",
    type: "event",
  },
] as const;
