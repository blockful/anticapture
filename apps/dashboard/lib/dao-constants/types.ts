import { Address } from "viem";

export type DaoConstants = {
  name: string;
  contracts: {
    governor: Address;
    token: Address;
    timelock: Address;
  };
  snapshot: string;
  rules: {
    delay: boolean;
    changeVote: boolean;
    timelock: boolean;
    cancelFunction: boolean;
  };
};
